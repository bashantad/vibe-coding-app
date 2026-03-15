import logging

from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user

from models import db, Bookmark

logger = logging.getLogger(__name__)

bp = Blueprint("bookmarks", __name__, url_prefix="/api/bookmarks")


def _bookmark_dict(bookmark):
    return {
        "id": bookmark.id,
        "url": bookmark.url,
        "title": bookmark.title,
        "description": bookmark.description,
        "user_id": bookmark.user_id,
        "created_at": bookmark.created_at.isoformat() if bookmark.created_at else None,
    }


@bp.route("/", methods=["GET"], strict_slashes=False)
@login_required
def index():
    bookmarks = (
        Bookmark.query.filter_by(user_id=current_user.id)
        .order_by(Bookmark.created_at.desc())
        .all()
    )
    return jsonify({"bookmarks": [_bookmark_dict(b) for b in bookmarks]}), 200


@bp.route("/", methods=["POST"], strict_slashes=False)
@login_required
def add():
    data = request.get_json() or {}
    url = data.get("url", "").strip()
    title = data.get("title", "").strip()
    description = data.get("description", "").strip()

    if not url:
        return jsonify({"error": "URL is required."}), 400
    if not title:
        return jsonify({"error": "Title is required."}), 400

    bookmark = Bookmark(
        url=url,
        title=title,
        description=description,
        user_id=current_user.id,
    )
    db.session.add(bookmark)
    db.session.commit()
    logger.info("Added bookmark %d: %s", bookmark.id, title)
    return jsonify({"bookmark": _bookmark_dict(bookmark)}), 201


@bp.route("/<int:bookmark_id>", methods=["DELETE"])
@login_required
def delete(bookmark_id):
    bookmark = db.session.get(Bookmark, bookmark_id)
    if not bookmark:
        return jsonify({"error": "Bookmark not found."}), 404
    if bookmark.user_id != current_user.id:
        return jsonify({"error": "Not authorized."}), 403
    db.session.delete(bookmark)
    db.session.commit()
    logger.info("Deleted bookmark %d", bookmark_id)
    return jsonify({"message": "Bookmark deleted."}), 200
