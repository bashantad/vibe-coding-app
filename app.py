import logging

from flask import Flask

app = Flask(__name__)

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
