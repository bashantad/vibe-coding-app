from conftest import login
from models import Todo


class TestTodoIndex:
    def test_index_public(self, client, db):
        resp = client.get("/api/todos")
        assert resp.status_code == 200
        assert resp.get_json()["todos"] == []

    def test_index_shows_todos(self, client, db):
        db.session.add(Todo(title="Buy milk", author="legacy"))
        db.session.commit()
        resp = client.get("/api/todos")
        todos = resp.get_json()["todos"]
        assert len(todos) == 1
        assert todos[0]["title"] == "Buy milk"
        assert todos[0]["author"] == "legacy"


class TestTodoAdd:
    def test_add_requires_login(self, client, db):
        resp = client.post("/api/todos", json={"title": "Test"})
        assert resp.status_code == 401

    def test_add_creates_todo(self, client, user):
        login(client)
        resp = client.post("/api/todos", json={"title": "New todo"})
        assert resp.status_code == 201
        todo = resp.get_json()["todo"]
        assert todo["title"] == "New todo"
        assert todo["author"] == "alice"
        assert todo["user_id"] == user.id

    def test_add_empty_title(self, client, user):
        login(client)
        resp = client.post("/api/todos", json={"title": ""})
        assert resp.status_code == 400
        assert Todo.query.count() == 0


class TestTodoToggle:
    def test_toggle_requires_login(self, client, db):
        todo = Todo(title="Test", author="x")
        db.session.add(todo)
        db.session.commit()
        resp = client.patch(f"/api/todos/{todo.id}/toggle")
        assert resp.status_code == 401

    def test_toggle_own_todo(self, client, user):
        login(client)
        client.post("/api/todos", json={"title": "Mine"})
        todo = Todo.query.first()
        assert todo.done is False
        resp = client.patch(f"/api/todos/{todo.id}/toggle")
        assert resp.status_code == 200
        assert resp.get_json()["todo"]["done"] is True

    def test_toggle_other_user_todo_denied(self, client, user, other_user, db):
        todo = Todo(title="Bob's", author="bob", user_id=other_user.id)
        db.session.add(todo)
        db.session.commit()
        login(client, "alice", "password123")
        resp = client.patch(f"/api/todos/{todo.id}/toggle")
        assert resp.status_code == 403
        todo = Todo.query.first()
        assert todo.done is False

    def test_toggle_legacy_todo_allowed(self, client, user, db):
        todo = Todo(title="Legacy", author="old", user_id=None)
        db.session.add(todo)
        db.session.commit()
        login(client)
        resp = client.patch(f"/api/todos/{todo.id}/toggle")
        assert resp.status_code == 200
        assert resp.get_json()["todo"]["done"] is True

    def test_toggle_nonexistent(self, client, user):
        login(client)
        resp = client.patch("/api/todos/999/toggle")
        assert resp.status_code == 404


class TestTodoDelete:
    def test_delete_requires_login(self, client, db):
        todo = Todo(title="Test", author="x")
        db.session.add(todo)
        db.session.commit()
        resp = client.delete(f"/api/todos/{todo.id}")
        assert resp.status_code == 401

    def test_delete_own_todo(self, client, user):
        login(client)
        client.post("/api/todos", json={"title": "Delete me"})
        todo = Todo.query.first()
        resp = client.delete(f"/api/todos/{todo.id}")
        assert resp.status_code == 200
        assert Todo.query.count() == 0

    def test_delete_other_user_todo_denied(self, client, user, other_user, db):
        todo = Todo(title="Bob's", author="bob", user_id=other_user.id)
        db.session.add(todo)
        db.session.commit()
        login(client, "alice", "password123")
        resp = client.delete(f"/api/todos/{todo.id}")
        assert resp.status_code == 403
        assert Todo.query.count() == 1

    def test_delete_legacy_todo_allowed(self, client, user, db):
        todo = Todo(title="Legacy", author="old", user_id=None)
        db.session.add(todo)
        db.session.commit()
        login(client)
        resp = client.delete(f"/api/todos/{todo.id}")
        assert resp.status_code == 200
        assert Todo.query.count() == 0

    def test_delete_nonexistent(self, client, user):
        login(client)
        resp = client.delete("/api/todos/999")
        assert resp.status_code == 404
