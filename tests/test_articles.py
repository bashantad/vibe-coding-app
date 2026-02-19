from conftest import login
from models import Article


class TestArticleList:
    def test_list_public(self, client, db):
        resp = client.get("/api/articles")
        assert resp.status_code == 200
        assert resp.get_json()["articles"] == []

    def test_list_shows_articles(self, client, db):
        db.session.add(Article(title="Test Article", author="legacy", description="desc"))
        db.session.commit()
        resp = client.get("/api/articles")
        articles = resp.get_json()["articles"]
        assert len(articles) == 1
        assert articles[0]["title"] == "Test Article"


class TestArticleDetail:
    def test_detail_public(self, client, db):
        art = Article(title="Public Article", author="someone", description="Hello")
        db.session.add(art)
        db.session.commit()
        resp = client.get(f"/api/articles/{art.id}")
        assert resp.status_code == 200
        data = resp.get_json()["article"]
        assert data["title"] == "Public Article"
        assert data["description"] == "Hello"
        assert "comments" in data

    def test_detail_nonexistent(self, client, db):
        resp = client.get("/api/articles/999")
        assert resp.status_code == 404


class TestArticleAdd:
    def test_add_requires_login(self, client, db):
        resp = client.post("/api/articles", json={"title": "Test", "description": ""})
        assert resp.status_code == 401

    def test_add_creates_article(self, client, user):
        login(client)
        resp = client.post(
            "/api/articles",
            json={"title": "New Art", "description": "Desc", "tags": "a, b"},
        )
        assert resp.status_code == 201
        art = resp.get_json()["article"]
        assert art["title"] == "New Art"
        assert art["author"] == "alice"
        assert art["user_id"] == user.id
        assert "a" in art["tags"]
        assert "b" in art["tags"]

    def test_add_empty_title(self, client, user):
        login(client)
        resp = client.post("/api/articles", json={"title": "", "description": ""})
        assert resp.status_code == 400
        assert Article.query.count() == 0


class TestArticleUpdate:
    def test_update_requires_login(self, client, db):
        art = Article(title="T", author="a")
        db.session.add(art)
        db.session.commit()
        resp = client.put(f"/api/articles/{art.id}", json={"title": "New"})
        assert resp.status_code == 401

    def test_update_own_article(self, client, user, db):
        art = Article(title="Old", author="alice", user_id=user.id)
        db.session.add(art)
        db.session.commit()
        login(client)
        resp = client.put(
            f"/api/articles/{art.id}",
            json={"title": "Updated", "description": "New desc", "tags": "x"},
        )
        assert resp.status_code == 200
        data = resp.get_json()["article"]
        assert data["title"] == "Updated"
        assert data["description"] == "New desc"

    def test_update_other_user_denied(self, client, user, other_user, db):
        art = Article(title="Bob's", author="bob", user_id=other_user.id)
        db.session.add(art)
        db.session.commit()
        login(client, "alice", "password123")
        resp = client.put(f"/api/articles/{art.id}", json={"title": "Hacked"})
        assert resp.status_code == 403
        art = Article.query.first()
        assert art.title == "Bob's"

    def test_update_empty_title(self, client, user, db):
        art = Article(title="Old", author="alice", user_id=user.id)
        db.session.add(art)
        db.session.commit()
        login(client)
        resp = client.put(
            f"/api/articles/{art.id}", json={"title": "", "description": ""}
        )
        assert resp.status_code == 400
        art = Article.query.first()
        assert art.title == "Old"

    def test_update_nonexistent(self, client, user):
        login(client)
        resp = client.put("/api/articles/999", json={"title": "X"})
        assert resp.status_code == 404


class TestArticleDelete:
    def test_delete_requires_login(self, client, db):
        art = Article(title="T", author="a")
        db.session.add(art)
        db.session.commit()
        resp = client.delete(f"/api/articles/{art.id}")
        assert resp.status_code == 401

    def test_delete_own_article(self, client, user, db):
        art = Article(title="Mine", author="alice", user_id=user.id)
        db.session.add(art)
        db.session.commit()
        login(client)
        resp = client.delete(f"/api/articles/{art.id}")
        assert resp.status_code == 200
        assert Article.query.count() == 0

    def test_delete_other_user_denied(self, client, user, other_user, db):
        art = Article(title="Bob's", author="bob", user_id=other_user.id)
        db.session.add(art)
        db.session.commit()
        login(client, "alice", "password123")
        resp = client.delete(f"/api/articles/{art.id}")
        assert resp.status_code == 403
        assert Article.query.count() == 1

    def test_delete_legacy_article_allowed(self, client, user, db):
        art = Article(title="Legacy", author="old", user_id=None)
        db.session.add(art)
        db.session.commit()
        login(client)
        resp = client.delete(f"/api/articles/{art.id}")
        assert resp.status_code == 200
        assert Article.query.count() == 0

    def test_delete_nonexistent(self, client, user):
        login(client)
        resp = client.delete("/api/articles/999")
        assert resp.status_code == 404
