import pytest

from app import app as flask_app
from models import db as _db, User


@pytest.fixture()
def app():
    flask_app.config.update(
        {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
            "WTF_CSRF_ENABLED": False,
            "SECRET_KEY": "test-secret",
        }
    )
    with flask_app.app_context():
        _db.create_all()
        yield flask_app
        _db.session.remove()
        _db.drop_all()


@pytest.fixture()
def db(app):
    return _db


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def runner(app):
    return app.test_cli_runner()


def _create_user(db, username="alice", password="password123"):
    user = User(username=username)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return user


@pytest.fixture()
def user(db):
    return _create_user(db, "alice", "password123")


@pytest.fixture()
def other_user(db):
    return _create_user(db, "bob", "password456")


def login(client, username="alice", password="password123"):
    return client.post(
        "/login",
        data={"username": username, "password": password},
        follow_redirects=True,
    )


def signup(client, username="alice", password="password123"):
    return client.post(
        "/signup",
        data={"username": username, "password": password},
        follow_redirects=True,
    )
