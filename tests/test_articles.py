from conftest import login
from models import Article


class TestArticleList:
    def test_list_public(self, client, db):
        resp = client.get("/articles")
        assert resp.status_code == 200
        assert b"Articles" in resp.data

    def test_list_shows_articles(self, client, db):
        db.session.add(Article(title="Test Article", author="legacy", description="desc"))
        db.session.commit()
        resp = client.get("/articles")
        assert b"Test Article" in resp.data

    def test_new_button_hidden_logged_out(self, client, db):
        resp = client.get("/articles")
        assert b"+ New Article" not in resp.data

    def test_new_button_shown_logged_in(self, client, user):
        login(client)
        resp = client.get("/articles")
        assert b"+ New Article" in resp.data

    def test_edit_delete_shown_for_owner(self, client, user, db):
        db.session.add(Article(title="Mine", author="alice", user_id=user.id))
        db.session.commit()
        login(client)
        resp = client.get("/articles")
        assert b"Edit" in resp.data

    def test_edit_delete_hidden_for_non_owner(self, client, user, other_user, db):
        db.session.add(Article(title="Bob's", author="bob", user_id=other_user.id))
        db.session.commit()
        login(client, "alice", "password123")
        resp = client.get("/articles")
        assert b"Edit" not in resp.data


class TestArticleDetail:
    def test_detail_public(self, client, db):
        art = Article(title="Public Article", author="someone", description="Hello")
        db.session.add(art)
        db.session.commit()
        resp = client.get(f"/articles/{art.id}")
        assert resp.status_code == 200
        assert b"Public Article" in resp.data
        assert b"Hello" in resp.data

    def test_detail_nonexistent(self, client, db):
        resp = client.get("/articles/999")
        assert resp.status_code == 302


class TestArticleNew:
    def test_new_requires_login(self, client, db):
        resp = client.get("/articles/new")
        assert resp.status_code == 302
        assert "/login" in resp.headers["Location"]

    def test_new_loads_for_logged_in(self, client, user):
        login(client)
        resp = client.get("/articles/new")
        assert resp.status_code == 200
        assert b"New Article" in resp.data
        assert b'name="author"' not in resp.data


class TestArticleAdd:
    def test_add_requires_login(self, client, db):
        resp = client.post("/articles/add", data={"title": "Test", "description": ""})
        assert resp.status_code == 302
        assert "/login" in resp.headers["Location"]

    def test_add_creates_article(self, client, user):
        login(client)
        resp = client.post(
            "/articles/add",
            data={"title": "New Art", "description": "Desc", "tags": "a, b"},
            follow_redirects=True,
        )
        assert resp.status_code == 200
        art = Article.query.first()
        assert art.title == "New Art"
        assert art.author == "alice"
        assert art.user_id == user.id
        assert "a" in art.tags
        assert "b" in art.tags

    def test_add_empty_title(self, client, user):
        login(client)
        client.post("/articles/add", data={"title": "", "description": ""})
        assert Article.query.count() == 0


class TestArticleEdit:
    def test_edit_requires_login(self, client, db):
        art = Article(title="T", author="a")
        db.session.add(art)
        db.session.commit()
        resp = client.get(f"/articles/edit/{art.id}")
        assert resp.status_code == 302
        assert "/login" in resp.headers["Location"]

    def test_edit_own_article(self, client, user, db):
        art = Article(title="Mine", author="alice", user_id=user.id)
        db.session.add(art)
        db.session.commit()
        login(client)
        resp = client.get(f"/articles/edit/{art.id}")
        assert resp.status_code == 200
        assert b"Edit Article" in resp.data

    def test_edit_other_user_denied(self, client, user, other_user, db):
        art = Article(title="Bob's", author="bob", user_id=other_user.id)
        db.session.add(art)
        db.session.commit()
        login(client, "alice", "password123")
        resp = client.get(f"/articles/edit/{art.id}")
        assert resp.status_code == 302


class TestArticleUpdate:
    def test_update_requires_login(self, client, db):
        art = Article(title="T", author="a")
        db.session.add(art)
        db.session.commit()
        resp = client.post(f"/articles/update/{art.id}", data={"title": "New"})
        assert resp.status_code == 302
        assert "/login" in resp.headers["Location"]

    def test_update_own_article(self, client, user, db):
        art = Article(title="Old", author="alice", user_id=user.id)
        db.session.add(art)
        db.session.commit()
        login(client)
        client.post(
            f"/articles/update/{art.id}",
            data={"title": "Updated", "description": "New desc", "tags": "x"},
        )
        art = Article.query.first()
        assert art.title == "Updated"
        assert art.description == "New desc"

    def test_update_other_user_denied(self, client, user, other_user, db):
        art = Article(title="Bob's", author="bob", user_id=other_user.id)
        db.session.add(art)
        db.session.commit()
        login(client, "alice", "password123")
        client.post(f"/articles/update/{art.id}", data={"title": "Hacked"})
        art = Article.query.first()
        assert art.title == "Bob's"

    def test_update_empty_title(self, client, user, db):
        art = Article(title="Old", author="alice", user_id=user.id)
        db.session.add(art)
        db.session.commit()
        login(client)
        client.post(f"/articles/update/{art.id}", data={"title": "", "description": ""})
        art = Article.query.first()
        assert art.title == "Old"


class TestArticleDelete:
    def test_delete_requires_login(self, client, db):
        art = Article(title="T", author="a")
        db.session.add(art)
        db.session.commit()
        resp = client.get(f"/articles/delete/{art.id}")
        assert resp.status_code == 302
        assert "/login" in resp.headers["Location"]

    def test_delete_own_article(self, client, user, db):
        art = Article(title="Mine", author="alice", user_id=user.id)
        db.session.add(art)
        db.session.commit()
        login(client)
        client.get(f"/articles/delete/{art.id}")
        assert Article.query.count() == 0

    def test_delete_other_user_denied(self, client, user, other_user, db):
        art = Article(title="Bob's", author="bob", user_id=other_user.id)
        db.session.add(art)
        db.session.commit()
        login(client, "alice", "password123")
        client.get(f"/articles/delete/{art.id}")
        assert Article.query.count() == 1

    def test_delete_legacy_article_allowed(self, client, user, db):
        art = Article(title="Legacy", author="old", user_id=None)
        db.session.add(art)
        db.session.commit()
        login(client)
        client.get(f"/articles/delete/{art.id}")
        assert Article.query.count() == 0

    def test_delete_nonexistent(self, client, user):
        login(client)
        resp = client.get("/articles/delete/999", follow_redirects=True)
        assert resp.status_code == 200
