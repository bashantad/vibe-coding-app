from unittest.mock import MagicMock, patch

from conftest import login
from models import ChatMessage


def _mock_claude_response(text="Great question about presentations!"):
    response = MagicMock()
    content_block = MagicMock()
    content_block.text = text
    response.content = [content_block]
    return response


class TestGetMessages:
    def test_requires_login(self, client):
        resp = client.get("/api/chat/messages")
        assert resp.status_code == 401

    def test_returns_empty_list(self, client, user):
        login(client)
        resp = client.get("/api/chat/messages")
        assert resp.status_code == 200
        assert resp.get_json()["messages"] == []

    def test_returns_only_current_user_messages(self, client, user, other_user, db):
        msg1 = ChatMessage(user_id=user.id, role="user", content="Hello")
        msg2 = ChatMessage(user_id=other_user.id, role="user", content="Bob's msg")
        db.session.add_all([msg1, msg2])
        db.session.commit()
        login(client)
        resp = client.get("/api/chat/messages")
        assert resp.status_code == 200
        messages = resp.get_json()["messages"]
        assert len(messages) == 1
        assert messages[0]["content"] == "Hello"


class TestSendMessage:
    def test_requires_login(self, client):
        resp = client.post("/api/chat/messages", json={"content": "Hi"})
        assert resp.status_code == 401

    def test_validates_content(self, client, user):
        login(client)
        resp = client.post("/api/chat/messages", json={"content": ""})
        assert resp.status_code == 400

    @patch("routes.chat._get_client")
    def test_saves_both_messages(self, mock_get_client, client, user, db):
        mock_client = MagicMock()
        mock_client.messages.create.return_value = _mock_claude_response("Try eye contact!")
        mock_get_client.return_value = mock_client

        login(client)
        resp = client.post("/api/chat/messages", json={"content": "How do I engage my audience?"})
        assert resp.status_code == 201
        messages = resp.get_json()["messages"]
        assert len(messages) == 2
        assert messages[0]["role"] == "user"
        assert messages[0]["content"] == "How do I engage my audience?"
        assert messages[1]["role"] == "assistant"
        assert messages[1]["content"] == "Try eye contact!"
        assert ChatMessage.query.filter_by(user_id=user.id).count() == 2

    @patch("routes.chat._get_client")
    def test_handles_api_failure(self, mock_get_client, client, user, db):
        mock_client = MagicMock()
        mock_client.messages.create.side_effect = Exception("API down")
        mock_get_client.return_value = mock_client

        login(client)
        resp = client.post("/api/chat/messages", json={"content": "Hello"})
        assert resp.status_code == 502
        assert "error" in resp.get_json()
        # User message is saved but no assistant message
        assert ChatMessage.query.filter_by(user_id=user.id, role="user").count() == 1
        assert ChatMessage.query.filter_by(user_id=user.id, role="assistant").count() == 0


class TestClearMessages:
    def test_requires_login(self, client):
        resp = client.delete("/api/chat/messages")
        assert resp.status_code == 401

    def test_clears_only_current_user_messages(self, client, user, other_user, db):
        msg1 = ChatMessage(user_id=user.id, role="user", content="Hello")
        msg2 = ChatMessage(user_id=other_user.id, role="user", content="Bob's msg")
        db.session.add_all([msg1, msg2])
        db.session.commit()
        login(client)
        resp = client.delete("/api/chat/messages")
        assert resp.status_code == 200
        assert ChatMessage.query.filter_by(user_id=user.id).count() == 0
        assert ChatMessage.query.filter_by(user_id=other_user.id).count() == 1
