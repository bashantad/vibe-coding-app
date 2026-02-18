from flask_login import UserMixin
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

article_tags = db.Table(
    "article_tags",
    db.Column("article_id", db.Integer, db.ForeignKey("article.id"), primary_key=True),
    db.Column("tag_id", db.Integer, db.ForeignKey("tag.id"), primary_key=True),
)


class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(128), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method="pbkdf2:sha256")

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Todo(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(256), nullable=False)
    author = db.Column(db.String(128), default="")
    done = db.Column(db.Boolean, default=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)

    user = db.relationship("User", backref="todos", lazy=True)


class Tag(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), unique=True, nullable=False)


class Article(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(256), nullable=False)
    description = db.Column(db.Text, default="")
    author = db.Column(db.String(128), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)

    user = db.relationship("User", backref="articles", lazy=True)
    comments = db.relationship(
        "Comment", backref="article", cascade="all, delete-orphan", lazy=True
    )
    tag_objects = db.relationship("Tag", secondary=article_tags, lazy=True)

    @property
    def tags(self):
        return [t.name for t in self.tag_objects]


class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    author = db.Column(db.String(128), default="Anonymous")
    description = db.Column(db.Text, nullable=False)
    article_id = db.Column(db.Integer, db.ForeignKey("article.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)

    user = db.relationship("User", backref="comments", lazy=True)
