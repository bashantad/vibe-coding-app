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

    def test_delete_parent_cascades_to_replies(self, client, user, db):
        art = _create_article(db, user)
        parent = Comment(author="alice", description="Parent", article_id=art.id, user_id=user.id)
        db.session.add(parent)
        db.session.commit()
        reply = Comment(
            author="alice", description="Reply", article_id=art.id,
            user_id=user.id, parent_id=parent.id,
        )
        db.session.add(reply)
        db.session.commit()
        assert Comment.query.count() == 2
        login(client)
        resp = client.delete(f"/api/articles/{art.id}/comments/{parent.id}")
        assert resp.status_code == 200
        assert Comment.query.count() == 0


class TestCommentReplies:
    def test_reply_creates_child_with_parent_id(self, client, user, db):
        art = _create_article(db, user)
        parent = Comment(author="alice", description="Parent", article_id=art.id, user_id=user.id)
        db.session.add(parent)
        db.session.commit()
        login(client)
        resp = client.post(
            f"/api/articles/{art.id}/comments",
            json={"description": "A reply", "parent_id": parent.id},
        )
        assert resp.status_code == 201
        reply = resp.get_json()["comment"]
        assert reply["parent_id"] == parent.id
        assert reply["article_id"] == art.id

    def test_top_level_comment_has_null_parent_id(self, client, user, db):
        art = _create_article(db, user)
        login(client)
        resp = client.post(
            f"/api/articles/{art.id}/comments",
            json={"description": "Top-level"},
        )
        assert resp.status_code == 201
        comment = resp.get_json()["comment"]
        assert comment["parent_id"] is None

    def test_reply_to_nonexistent_parent_returns_404(self, client, user, db):
        art = _create_article(db, user)
        login(client)
        resp = client.post(
            f"/api/articles/{art.id}/comments",
            json={"description": "Orphan reply", "parent_id": 999},
        )
        assert resp.status_code == 404

    def test_reply_to_comment_on_different_article_returns_404(self, client, user, db):
        art1 = _create_article(db, user)
        art2 = Article(title="Other Article", author="alice", user_id=user.id)
        db.session.add(art2)
        db.session.commit()
        comment_on_art2 = Comment(
            author="alice", description="On art2", article_id=art2.id, user_id=user.id,
        )
        db.session.add(comment_on_art2)
        db.session.commit()
        login(client)
        resp = client.post(
            f"/api/articles/{art1.id}/comments",
            json={"description": "Cross-article reply", "parent_id": comment_on_art2.id},
        )
        assert resp.status_code == 404

    def test_article_detail_includes_parent_id(self, client, user, db):
        art = _create_article(db, user)
        parent = Comment(author="alice", description="Parent", article_id=art.id, user_id=user.id)
        db.session.add(parent)
        db.session.commit()
        reply = Comment(
            author="alice", description="Reply", article_id=art.id,
            user_id=user.id, parent_id=parent.id,
        )
        db.session.add(reply)
        db.session.commit()
        resp = client.get(f"/api/articles/{art.id}")
        assert resp.status_code == 200
        comments = resp.get_json()["article"]["comments"]
        by_id = {c["id"]: c for c in comments}
        assert by_id[parent.id]["parent_id"] is None
        assert by_id[reply.id]["parent_id"] == parent.id
