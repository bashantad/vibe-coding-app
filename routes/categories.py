from flask import Blueprint, jsonify

from models import Category

bp = Blueprint("categories", __name__, url_prefix="/api/categories")


@bp.route("/", methods=["GET"], strict_slashes=False)
def list_categories():
    categories = Category.query.order_by(Category.name).all()
    return jsonify({"categories": [{"id": c.id, "name": c.name} for c in categories]}), 200
