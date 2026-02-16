import logging
import os

from flask import Flask
from flask_migrate import Migrate

from models import db

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
    "DATABASE_URL", "postgresql://todoapp:todoapp@localhost:5432/todoapp"
)

db.init_app(app)
migrate = Migrate(app, db)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)

from routes.todos import bp as todos_bp
from routes.articles import bp as articles_bp
from routes.comments import bp as comments_bp

app.register_blueprint(todos_bp)
app.register_blueprint(articles_bp)
app.register_blueprint(comments_bp)

if __name__ == "__main__":
    app.run(debug=True)
