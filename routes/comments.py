import logging

from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user

from models import db, Article, Comment

logger = logging.getLogger(__name__)

bp = Blueprint("comments", __name__, url_prefix="/api/articles/<int:article_id>/comments")


@bp.route("/", methods=["POST"], strict_slashes=False)
@login_required
def add(article_id):
    article = db.session.get(Article, article_id)
    if not article:
        return jsonify({"error": "Article not found."}), 404
    data = request.get_json() or {}
    description = data.get("description", "").strip()
    if not description:
        return jsonify({"error": "Description is required."}), 400
    parent_id = data.get("parent_id")
    if parent_id is not None:
        parent = db.session.get(Comment, parent_id)
        if not parent or parent.article_id != article_id:
            return jsonify({"error": "Parent comment not found."}), 404
    comment = Comment(
        author=current_user.username,
        description=description,
        article_id=article_id,
        user_id=current_user.id,
        parent_id=parent_id,
    )
    db.session.add(comment)
    db.session.commit()
    logger.info("Added comment %d to article %d", comment.id, article_id)
    return jsonify({
        "comment": {
            "id": comment.id,
            "author": comment.author,
            "description": comment.description,
            "article_id": comment.article_id,
            "user_id": comment.user_id,
            "parent_id": comment.parent_id,
        }
    }), 201


@bp.route("/<int:comment_id>", methods=["DELETE"])
@login_required
def delete(article_id, comment_id):
    article = db.session.get(Article, article_id)
    if not article:
        return jsonify({"error": "Article not found."}), 404
    comment = db.session.get(Comment, comment_id)
    if not comment or comment.article_id != article_id:
        return jsonify({"error": "Comment not found."}), 404
    if comment.user_id and comment.user_id != current_user.id:
        return jsonify({"error": "Not authorized."}), 403
    db.session.delete(comment)
    db.session.commit()
    logger.info("Deleted comment %d from article %d", comment_id, article_id)
    return jsonify({"message": "Comment deleted."}), 200
