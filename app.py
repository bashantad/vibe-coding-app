import logging
import os

from flask import Flask, jsonify, redirect, send_from_directory
from flask_login import LoginManager
from flask_migrate import Migrate

from models import db, User, ShortUrl

app = Flask(__name__, static_folder=None)
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
    "DATABASE_URL", "postgresql://todoapp:todoapp@localhost:5432/todoapp"
)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-key-change-me")

db.init_app(app)
migrate = Migrate(app, db)

login_manager = LoginManager()
login_manager.init_app(app)


@login_manager.unauthorized_handler
def unauthorized():
    return jsonify({"error": "Authentication required."}), 401


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
from routes.categories import bp as categories_bp
from routes.feeds import bp as feeds_bp
from routes.bookmarks import bp as bookmarks_bp
from routes.shortener import bp as shortener_bp

app.register_blueprint(auth_bp)
app.register_blueprint(todos_bp)
app.register_blueprint(articles_bp)
app.register_blueprint(comments_bp)
app.register_blueprint(categories_bp)
app.register_blueprint(feeds_bp)
app.register_blueprint(bookmarks_bp)
app.register_blueprint(shortener_bp)

FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "frontend", "dist")


@app.route("/s/<short_code>")
def redirect_short_url(short_code):
    short_url = ShortUrl.query.filter_by(short_code=short_code).first()
    if not short_url:
        return jsonify({"error": "Short URL not found."}), 404
    short_url.click_count += 1
    db.session.commit()
    return redirect(short_url.original_url)


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    if path.startswith("api/"):
        return jsonify({"error": "Not found"}), 404
    full = os.path.join(FRONTEND_DIST, path)
    if path and os.path.isfile(full):
        return send_from_directory(FRONTEND_DIST, path)
    return send_from_directory(FRONTEND_DIST, "index.html")


if __name__ == "__main__":
    app.run(debug=True, port=5001)
