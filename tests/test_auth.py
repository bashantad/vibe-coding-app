from conftest import login, signup
from models import User


class TestSignup:
    def test_signup_page_loads(self, client):
        resp = client.get("/signup")
        assert resp.status_code == 200
        assert b"Sign Up" in resp.data

    def test_signup_creates_user(self, client, db):
        resp = signup(client, "newuser", "secret")
        assert resp.status_code == 200
        user = User.query.filter_by(username="newuser").first()
        assert user is not None
        assert user.check_password("secret")

    def test_signup_auto_logs_in(self, client, db):
        signup(client, "newuser", "secret")
        resp = client.get("/")
        assert b"newuser" in resp.data
        assert b"Logout" in resp.data

    def test_signup_duplicate_username(self, client, user):
        resp = signup(client, "alice", "other")
        assert b"Username already taken" in resp.data

    def test_signup_empty_fields(self, client, db):
        resp = signup(client, "", "pass")
        assert b"Username and password are required" in resp.data

        resp = signup(client, "user", "")
        assert b"Username and password are required" in resp.data


class TestLogin:
    def test_login_page_loads(self, client):
        resp = client.get("/login")
        assert resp.status_code == 200
        assert b"Login" in resp.data

    def test_login_valid(self, client, user):
        resp = login(client, "alice", "password123")
        assert resp.status_code == 200
        assert b"alice" in resp.data
        assert b"Logout" in resp.data

    def test_login_wrong_password(self, client, user):
        resp = login(client, "alice", "wrong")
        assert b"Invalid username or password" in resp.data

    def test_login_nonexistent_user(self, client, db):
        resp = login(client, "nobody", "pass")
        assert b"Invalid username or password" in resp.data

    def test_login_redirects_to_next(self, client, user):
        resp = client.post(
            "/login?next=%2Farticles%2Fnew",
            data={"username": "alice", "password": "password123"},
        )
        assert resp.status_code == 302
        assert "/articles/new" in resp.headers["Location"]


class TestLogout:
    def test_logout(self, client, user):
        login(client)
        resp = client.get("/logout", follow_redirects=True)
        assert resp.status_code == 200
        assert b"Login" in resp.data
        assert b"Logout" not in resp.data

    def test_logout_requires_login(self, client, db):
        resp = client.get("/logout")
        assert resp.status_code == 302
        assert "/login" in resp.headers["Location"]


class TestProfile:
    def test_profile_get_requires_login(self, client, db):
        resp = client.get("/profile")
        assert resp.status_code == 302
        assert "/login" in resp.headers["Location"]

    def test_profile_post_requires_login(self, client, db):
        resp = client.post("/profile", data={"username": "alice"})
        assert resp.status_code == 302
        assert "/login" in resp.headers["Location"]

    def test_profile_page_loads(self, client, user):
        login(client)
        resp = client.get("/profile")
        assert resp.status_code == 200
        assert b"Edit Profile" in resp.data
        assert b"alice" in resp.data

    def test_update_username(self, client, user):
        login(client)
        resp = client.post(
            "/profile",
            data={"username": "alice_new", "full_name": "", "email": ""},
            follow_redirects=True,
        )
        assert b"Profile updated" in resp.data
        updated = User.query.get(user.id)
        assert updated.username == "alice_new"

    def test_update_full_name(self, client, user):
        login(client)
        resp = client.post(
            "/profile",
            data={"username": "alice", "full_name": "Alice Smith", "email": ""},
            follow_redirects=True,
        )
        assert b"Profile updated" in resp.data
        updated = User.query.get(user.id)
        assert updated.full_name == "Alice Smith"

    def test_update_email(self, client, user):
        login(client)
        resp = client.post(
            "/profile",
            data={"username": "alice", "full_name": "", "email": "alice@example.com"},
            follow_redirects=True,
        )
        assert b"Profile updated" in resp.data
        updated = User.query.get(user.id)
        assert updated.email == "alice@example.com"

    def test_reject_empty_username(self, client, user):
        login(client)
        resp = client.post(
            "/profile",
            data={"username": "", "full_name": "", "email": ""},
            follow_redirects=True,
        )
        assert b"Username is required" in resp.data

    def test_reject_duplicate_username(self, client, user, other_user):
        login(client)
        resp = client.post(
            "/profile",
            data={"username": "bob", "full_name": "", "email": ""},
            follow_redirects=True,
        )
        assert b"Username already taken" in resp.data
        updated = User.query.get(user.id)
        assert updated.username == "alice"

    def test_reject_invalid_email(self, client, user):
        login(client)
        resp = client.post(
            "/profile",
            data={"username": "alice", "full_name": "", "email": "not-an-email"},
            follow_redirects=True,
        )
        assert b"Invalid email address" in resp.data

    def test_same_username_no_error(self, client, user):
        login(client)
        resp = client.post(
            "/profile",
            data={"username": "alice", "full_name": "Alice", "email": ""},
            follow_redirects=True,
        )
        assert b"Profile updated" in resp.data
        assert b"already taken" not in resp.data

    def test_clear_optional_fields_stores_none(self, client, user):
        login(client)
        # First set values
        client.post(
            "/profile",
            data={"username": "alice", "full_name": "Alice", "email": "a@b.com"},
            follow_redirects=True,
        )
        # Then clear them
        resp = client.post(
            "/profile",
            data={"username": "alice", "full_name": "", "email": ""},
            follow_redirects=True,
        )
        assert b"Profile updated" in resp.data
        updated = User.query.get(user.id)
        assert updated.full_name is None
        assert updated.email is None
