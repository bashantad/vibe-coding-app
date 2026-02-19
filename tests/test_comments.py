from conftest import login
from models import Article, Comment


def _create_article(db, user=None):
    art = Article(
        title="Test Article",
        author=user.username if user else "legacy",
        user_id=user.id if user else None,
    )
    db.session.add(art)
    db.session.commit()
    return art


class TestCommentAdd:
    def test_add_requires_login(self, client, db):
        art = _create_article(db)
        resp = client.post(
            f"/api/articles/{art.id}/comments", json={"description": "Hello"}
        )
        assert resp.status_code == 401

    def test_add_creates_comment(self, client, user, db):
        art = _create_article(db, user)
        login(client)
        resp = client.post(
            f"/api/articles/{art.id}/comments",
            json={"description": "Nice article!"},
        )
        assert resp.status_code == 201
        comment = resp.get_json()["comment"]
        assert comment["description"] == "Nice article!"
        assert comment["author"] == "alice"
        assert comment["user_id"] == user.id
        assert comment["article_id"] == art.id

    def test_add_empty_description(self, client, user, db):
        art = _create_article(db, user)
        login(client)
        resp = client.post(
            f"/api/articles/{art.id}/comments", json={"description": ""}
        )
        assert resp.status_code == 400
        assert Comment.query.count() == 0

    def test_add_to_nonexistent_article(self, client, user):
        login(client)
        resp = client.post(
            "/api/articles/999/comments", json={"description": "Hello"}
        )
        assert resp.status_code == 404


class TestCommentDelete:
    def test_delete_requires_login(self, client, db):
        art = _create_article(db)
        comment = Comment(author="anon", description="Hi", article_id=art.id)
        db.session.add(comment)
        db.session.commit()
        resp = client.delete(f"/api/articles/{art.id}/comments/{comment.id}")
        assert resp.status_code == 401

    def test_delete_own_comment(self, client, user, db):
        art = _create_article(db, user)
        comment = Comment(author="alice", description="My comment", article_id=art.id, user_id=user.id)
        db.session.add(comment)
        db.session.commit()
        login(client)
        resp = client.delete(f"/api/articles/{art.id}/comments/{comment.id}")
        assert resp.status_code == 200
        assert Comment.query.count() == 0

    def test_delete_other_user_comment_denied(self, client, user, other_user, db):
        art = _create_article(db, user)
        comment = Comment(author="bob", description="Bob's comment", article_id=art.id, user_id=other_user.id)
        db.session.add(comment)
        db.session.commit()
        login(client, "alice", "password123")
        resp = client.delete(f"/api/articles/{art.id}/comments/{comment.id}")
        assert resp.status_code == 403
        assert Comment.query.count() == 1

    def test_delete_legacy_comment_allowed(self, client, user, db):
        art = _create_article(db, user)
        comment = Comment(author="old", description="Legacy", article_id=art.id, user_id=None)
        db.session.add(comment)
        db.session.commit()
        login(client)
        resp = client.delete(f"/api/articles/{art.id}/comments/{comment.id}")
        assert resp.status_code == 200
        assert Comment.query.count() == 0

    def test_delete_comment_wrong_article(self, client, user, db):
        art1 = _create_article(db, user)
        art2 = Article(title="Other", author="alice", user_id=user.id)
        db.session.add(art2)
        db.session.commit()
        comment = Comment(author="alice", description="On art1", article_id=art1.id, user_id=user.id)
        db.session.add(comment)
        db.session.commit()
        login(client)
        resp = client.delete(f"/api/articles/{art2.id}/comments/{comment.id}")
        assert resp.status_code == 404
        assert Comment.query.count() == 1

    def test_delete_nonexistent_comment(self, client, user, db):
        art = _create_article(db, user)
        login(client)
        resp = client.delete(f"/api/articles/{art.id}/comments/999")
        assert resp.status_code == 404
