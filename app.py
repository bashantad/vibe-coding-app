import logging
import os

from flask import Flask
from flask_login import LoginManager
from flask_migrate import Migrate

from models import db, User

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
    "DATABASE_URL", "postgresql://todoapp:todoapp@localhost:5432/todoapp"
)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-key-change-me")

db.init_app(app)
migrate = Migrate(app, db)

login_manager = LoginManager()
login_manager.login_view = "auth.login"
login_manager.init_app(app)


@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)

from routes.auth import bp as auth_bp
from routes.todos import bp as todos_bp
from routes.articles import bp as articles_bp
from routes.comments import bp as comments_bp

app.register_blueprint(auth_bp)
app.register_blueprint(todos_bp)
app.register_blueprint(articles_bp)
app.register_blueprint(comments_bp)

if __name__ == "__main__":
    app.run(debug=True)
