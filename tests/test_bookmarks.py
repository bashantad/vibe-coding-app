from conftest import login
from models import Bookmark


class TestBookmarkIndex:
    def test_index_requires_login(self, client, db):
        resp = client.get("/api/bookmarks")
        assert resp.status_code == 401

    def test_index_returns_user_bookmarks(self, client, user):
        login(client)
        client.post("/api/bookmarks", json={"url": "https://example.com", "title": "Example"})
        resp = client.get("/api/bookmarks")
        assert resp.status_code == 200
        bookmarks = resp.get_json()["bookmarks"]
        assert len(bookmarks) == 1
        assert bookmarks[0]["title"] == "Example"
        assert bookmarks[0]["url"] == "https://example.com"

    def test_index_excludes_other_user_bookmarks(self, client, user, other_user, db):
        bm = Bookmark(url="https://bob.com", title="Bob's link", user_id=other_user.id)
        db.session.add(bm)
        db.session.commit()
        login(client, "alice", "password123")
        resp = client.get("/api/bookmarks")
        assert resp.status_code == 200
        assert resp.get_json()["bookmarks"] == []


class TestBookmarkAdd:
    def test_add_requires_login(self, client, db):
        resp = client.post("/api/bookmarks", json={"url": "https://example.com", "title": "Ex"})
        assert resp.status_code == 401

    def test_add_creates_bookmark(self, client, user):
        login(client)
        resp = client.post("/api/bookmarks", json={
            "url": "https://example.com",
            "title": "Example",
            "description": "A test bookmark",
        })
        assert resp.status_code == 201
        bm = resp.get_json()["bookmark"]
        assert bm["url"] == "https://example.com"
        assert bm["title"] == "Example"
        assert bm["description"] == "A test bookmark"
        assert bm["user_id"] == user.id

    def test_add_missing_url(self, client, user):
        login(client)
        resp = client.post("/api/bookmarks", json={"title": "No URL"})
        assert resp.status_code == 400
        assert Bookmark.query.count() == 0

    def test_add_missing_title(self, client, user):
        login(client)
        resp = client.post("/api/bookmarks", json={"url": "https://example.com"})
        assert resp.status_code == 400
        assert Bookmark.query.count() == 0


class TestBookmarkDelete:
    def test_delete_requires_login(self, client, user, db):
        bm = Bookmark(url="https://example.com", title="Ex", user_id=user.id)
        db.session.add(bm)
        db.session.commit()
        resp = client.delete(f"/api/bookmarks/{bm.id}")
        assert resp.status_code == 401

    def test_delete_own_bookmark(self, client, user):
        login(client)
        client.post("/api/bookmarks", json={"url": "https://example.com", "title": "Del me"})
        bm = Bookmark.query.first()
        resp = client.delete(f"/api/bookmarks/{bm.id}")
        assert resp.status_code == 200
        assert Bookmark.query.count() == 0

    def test_delete_other_user_bookmark_denied(self, client, user, other_user, db):
        bm = Bookmark(url="https://bob.com", title="Bob's", user_id=other_user.id)
        db.session.add(bm)
        db.session.commit()
        login(client, "alice", "password123")
        resp = client.delete(f"/api/bookmarks/{bm.id}")
        assert resp.status_code == 403
        assert Bookmark.query.count() == 1

    def test_delete_nonexistent(self, client, user):
        login(client)
        resp = client.delete("/api/bookmarks/999")
        assert resp.status_code == 404
