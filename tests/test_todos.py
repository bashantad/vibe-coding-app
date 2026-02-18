from conftest import login
from models import Todo


class TestTodoIndex:
    def test_index_public(self, client, db):
        resp = client.get("/")
        assert resp.status_code == 200
        assert b"Todo App" in resp.data

    def test_index_shows_todos(self, client, db):
        db.session.add(Todo(title="Buy milk", author="legacy"))
        db.session.commit()
        resp = client.get("/")
        assert b"Buy milk" in resp.data
        assert b"legacy" in resp.data

    def test_add_form_hidden_when_logged_out(self, client, db):
        resp = client.get("/")
        assert b'name="title"' not in resp.data

    def test_add_form_shown_when_logged_in(self, client, user):
        login(client)
        resp = client.get("/")
        assert b'name="title"' in resp.data


class TestTodoAdd:
    def test_add_requires_login(self, client, db):
        resp = client.post("/add", data={"title": "Test"})
        assert resp.status_code == 302
        assert "/login" in resp.headers["Location"]

    def test_add_creates_todo(self, client, user):
        login(client)
        resp = client.post("/add", data={"title": "New todo"}, follow_redirects=True)
        assert resp.status_code == 200
        todo = Todo.query.first()
        assert todo.title == "New todo"
        assert todo.author == "alice"
        assert todo.user_id == user.id

    def test_add_empty_title(self, client, user):
        login(client)
        client.post("/add", data={"title": ""})
        assert Todo.query.count() == 0


class TestTodoToggle:
    def test_toggle_requires_login(self, client, db):
        todo = Todo(title="Test", author="x")
        db.session.add(todo)
        db.session.commit()
        resp = client.get(f"/toggle/{todo.id}")
        assert resp.status_code == 302
        assert "/login" in resp.headers["Location"]

    def test_toggle_own_todo(self, client, user):
        login(client)
        client.post("/add", data={"title": "Mine"})
        todo = Todo.query.first()
        assert todo.done is False
        client.get(f"/toggle/{todo.id}")
        todo = Todo.query.first()
        assert todo.done is True

    def test_toggle_other_user_todo_denied(self, client, user, other_user, db):
        todo = Todo(title="Bob's", author="bob", user_id=other_user.id)
        db.session.add(todo)
        db.session.commit()
        login(client, "alice", "password123")
        client.get(f"/toggle/{todo.id}")
        todo = Todo.query.first()
        assert todo.done is False

    def test_toggle_legacy_todo_allowed(self, client, user, db):
        todo = Todo(title="Legacy", author="old", user_id=None)
        db.session.add(todo)
        db.session.commit()
        login(client)
        client.get(f"/toggle/{todo.id}")
        todo = Todo.query.first()
        assert todo.done is True

    def test_toggle_nonexistent(self, client, user):
        login(client)
        resp = client.get("/toggle/999", follow_redirects=True)
        assert resp.status_code == 200


class TestTodoDelete:
    def test_delete_requires_login(self, client, db):
        todo = Todo(title="Test", author="x")
        db.session.add(todo)
        db.session.commit()
        resp = client.get(f"/delete/{todo.id}")
        assert resp.status_code == 302
        assert "/login" in resp.headers["Location"]

    def test_delete_own_todo(self, client, user):
        login(client)
        client.post("/add", data={"title": "Delete me"})
        todo = Todo.query.first()
        client.get(f"/delete/{todo.id}")
        assert Todo.query.count() == 0

    def test_delete_other_user_todo_denied(self, client, user, other_user, db):
        todo = Todo(title="Bob's", author="bob", user_id=other_user.id)
        db.session.add(todo)
        db.session.commit()
        login(client, "alice", "password123")
        client.get(f"/delete/{todo.id}")
        assert Todo.query.count() == 1

    def test_delete_legacy_todo_allowed(self, client, user, db):
        todo = Todo(title="Legacy", author="old", user_id=None)
        db.session.add(todo)
        db.session.commit()
        login(client)
        client.get(f"/delete/{todo.id}")
        assert Todo.query.count() == 0

    def test_delete_nonexistent(self, client, user):
        login(client)
        resp = client.get("/delete/999", follow_redirects=True)
        assert resp.status_code == 200
