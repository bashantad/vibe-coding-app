from conftest import login, signup
from models import User


class TestSignup:
    def test_signup_creates_user(self, client, db):
        resp = signup(client, "newuser", "secret")
        assert resp.status_code == 201
        data = resp.get_json()
        assert data["user"]["username"] == "newuser"
        user = User.query.filter_by(username="newuser").first()
        assert user is not None
        assert user.check_password("secret")

    def test_signup_auto_logs_in(self, client, db):
        signup(client, "newuser", "secret")
        resp = client.get("/api/me")
        data = resp.get_json()
        assert data["user"]["username"] == "newuser"

    def test_signup_duplicate_username(self, client, user):
        resp = signup(client, "alice", "other")
        assert resp.status_code == 409
        assert "already taken" in resp.get_json()["error"]

    def test_signup_empty_fields(self, client, db):
        resp = signup(client, "", "pass")
        assert resp.status_code == 400
        assert "required" in resp.get_json()["error"]

        resp = signup(client, "user", "")
        assert resp.status_code == 400
        assert "required" in resp.get_json()["error"]


class TestLogin:
    def test_login_valid(self, client, user):
        resp = login(client, "alice", "password123")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["user"]["username"] == "alice"

    def test_login_wrong_password(self, client, user):
        resp = login(client, "alice", "wrong")
        assert resp.status_code == 401
        assert "Invalid" in resp.get_json()["error"]

    def test_login_nonexistent_user(self, client, db):
        resp = login(client, "nobody", "pass")
        assert resp.status_code == 401
        assert "Invalid" in resp.get_json()["error"]


class TestLogout:
    def test_logout(self, client, user):
        login(client)
        resp = client.post("/api/logout")
        assert resp.status_code == 200
        assert "Logged out" in resp.get_json()["message"]
        # Verify logged out
        resp = client.get("/api/me")
        assert resp.get_json()["user"] is None

    def test_logout_requires_login(self, client, db):
        resp = client.post("/api/logout")
        assert resp.status_code == 401


class TestMe:
    def test_me_logged_out(self, client, db):
        resp = client.get("/api/me")
        assert resp.status_code == 200
        assert resp.get_json()["user"] is None

    def test_me_logged_in(self, client, user):
        login(client)
        resp = client.get("/api/me")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["user"]["username"] == "alice"


class TestProfile:
    def test_profile_get_requires_login(self, client, db):
        resp = client.get("/api/profile")
        assert resp.status_code == 401

    def test_profile_put_requires_login(self, client, db):
        resp = client.put("/api/profile", json={"username": "alice"})
        assert resp.status_code == 401

    def test_profile_get(self, client, user):
        login(client)
        resp = client.get("/api/profile")
        assert resp.status_code == 200
        assert resp.get_json()["user"]["username"] == "alice"

    def test_update_username(self, client, user):
        login(client)
        resp = client.put(
            "/api/profile",
            json={"username": "alice_new", "full_name": "", "email": ""},
        )
        assert resp.status_code == 200
        assert "Profile updated" in resp.get_json()["message"]
        updated = User.query.get(user.id)
        assert updated.username == "alice_new"

    def test_update_full_name(self, client, user):
        login(client)
        resp = client.put(
            "/api/profile",
            json={"username": "alice", "full_name": "Alice Smith", "email": ""},
        )
        assert resp.status_code == 200
        assert "Profile updated" in resp.get_json()["message"]
        updated = User.query.get(user.id)
        assert updated.full_name == "Alice Smith"

    def test_update_email(self, client, user):
        login(client)
        resp = client.put(
            "/api/profile",
            json={"username": "alice", "full_name": "", "email": "alice@example.com"},
        )
        assert resp.status_code == 200
        assert "Profile updated" in resp.get_json()["message"]
        updated = User.query.get(user.id)
        assert updated.email == "alice@example.com"

    def test_reject_empty_username(self, client, user):
        login(client)
        resp = client.put(
            "/api/profile",
            json={"username": "", "full_name": "", "email": ""},
        )
        assert resp.status_code == 400
        assert "required" in resp.get_json()["error"]

    def test_reject_duplicate_username(self, client, user, other_user):
        login(client)
        resp = client.put(
            "/api/profile",
            json={"username": "bob", "full_name": "", "email": ""},
        )
        assert resp.status_code == 409
        assert "already taken" in resp.get_json()["error"]
        updated = User.query.get(user.id)
        assert updated.username == "alice"

    def test_reject_invalid_email(self, client, user):
        login(client)
        resp = client.put(
            "/api/profile",
            json={"username": "alice", "full_name": "", "email": "not-an-email"},
        )
        assert resp.status_code == 400
        assert "Invalid email" in resp.get_json()["error"]

    def test_same_username_no_error(self, client, user):
        login(client)
        resp = client.put(
            "/api/profile",
            json={"username": "alice", "full_name": "Alice", "email": ""},
        )
        assert resp.status_code == 200
        assert "Profile updated" in resp.get_json()["message"]

    def test_clear_optional_fields_stores_none(self, client, user):
        login(client)
        # First set values
        client.put(
            "/api/profile",
            json={"username": "alice", "full_name": "Alice", "email": "a@b.com"},
        )
        # Then clear them
        resp = client.put(
            "/api/profile",
            json={"username": "alice", "full_name": "", "email": ""},
        )
        assert resp.status_code == 200
        assert "Profile updated" in resp.get_json()["message"]
        updated = User.query.get(user.id)
        assert updated.full_name is None
        assert updated.email is None
