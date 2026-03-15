from conftest import login
from models import ShortUrl


class TestShortenerIndex:
    def test_index_requires_login(self, client, db):
        resp = client.get("/api/shortener")
        assert resp.status_code == 401

    def test_index_returns_user_urls(self, client, user):
        login(client)
        client.post("/api/shortener", json={"original_url": "https://example.com"})
        resp = client.get("/api/shortener")
        assert resp.status_code == 200
        urls = resp.get_json()["short_urls"]
        assert len(urls) == 1
        assert urls[0]["original_url"] == "https://example.com"
        assert urls[0]["short_url"].startswith("/s/")

    def test_index_excludes_other_user_urls(self, client, user, other_user, db):
        su = ShortUrl(
            short_code="other1",
            original_url="https://bob.com",
            user_id=other_user.id,
        )
        db.session.add(su)
        db.session.commit()
        login(client, "alice", "password123")
        resp = client.get("/api/shortener")
        assert resp.status_code == 200
        assert resp.get_json()["short_urls"] == []


class TestShortenerAdd:
    def test_add_requires_login(self, client, db):
        resp = client.post("/api/shortener", json={"original_url": "https://example.com"})
        assert resp.status_code == 401

    def test_add_creates_short_url(self, client, user):
        login(client)
        resp = client.post("/api/shortener", json={"original_url": "https://example.com"})
        assert resp.status_code == 201
        su = resp.get_json()["short_url"]
        assert su["original_url"] == "https://example.com"
        assert len(su["short_code"]) == 6
        assert su["short_url"] == f"/s/{su['short_code']}"
        assert su["click_count"] == 0
        assert su["user_id"] == user.id

    def test_add_missing_url_returns_400(self, client, user):
        login(client)
        resp = client.post("/api/shortener", json={})
        assert resp.status_code == 400
        assert ShortUrl.query.count() == 0


class TestShortenerDelete:
    def test_delete_requires_login(self, client, user, db):
        su = ShortUrl(short_code="del001", original_url="https://example.com", user_id=user.id)
        db.session.add(su)
        db.session.commit()
        resp = client.delete(f"/api/shortener/{su.id}")
        assert resp.status_code == 401

    def test_delete_own_url(self, client, user):
        login(client)
        client.post("/api/shortener", json={"original_url": "https://example.com"})
        su = ShortUrl.query.first()
        resp = client.delete(f"/api/shortener/{su.id}")
        assert resp.status_code == 200
        assert ShortUrl.query.count() == 0

    def test_delete_other_user_url_denied(self, client, user, other_user, db):
        su = ShortUrl(short_code="bob001", original_url="https://bob.com", user_id=other_user.id)
        db.session.add(su)
        db.session.commit()
        login(client, "alice", "password123")
        resp = client.delete(f"/api/shortener/{su.id}")
        assert resp.status_code == 403
        assert ShortUrl.query.count() == 1

    def test_delete_nonexistent(self, client, user):
        login(client)
        resp = client.delete("/api/shortener/999")
        assert resp.status_code == 404


class TestShortUrlRedirect:
    def test_redirect_valid_code(self, client, user):
        login(client)
        client.post("/api/shortener", json={"original_url": "https://example.com"})
        su = ShortUrl.query.first()
        resp = client.get(f"/s/{su.short_code}")
        assert resp.status_code == 302
        assert resp.headers["Location"] == "https://example.com"

    def test_redirect_increments_click_count(self, client, user, db):
        login(client)
        client.post("/api/shortener", json={"original_url": "https://example.com"})
        su = ShortUrl.query.first()
        assert su.click_count == 0
        client.get(f"/s/{su.short_code}")
        client.get(f"/s/{su.short_code}")
        db.session.expire_all()
        su_refreshed = ShortUrl.query.first()
        assert su_refreshed.click_count == 2

    def test_redirect_invalid_code_404(self, client, db):
        resp = client.get("/s/nonexistent")
        assert resp.status_code == 404
