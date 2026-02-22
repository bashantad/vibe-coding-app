import logging

from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user

from models import db, Article, Tag

logger = logging.getLogger(__name__)

bp = Blueprint("articles", __name__, url_prefix="/api/articles")


def _parse_tags(tags_raw):
    return [t.strip() for t in tags_raw.split(",") if t.strip()]

def _resolve_tags(tag_names):
    tags = []
    for name in tag_names:
        tag = Tag.query.filter_by(name=name).first()
        if not tag:
            tag = Tag(name=name)
            db.session.add(tag)
        tags.append(tag)
    return tags


def _article_dict(article, include_comments=False):
    d = {
        "id": article.id,
        "title": article.title,
        "description": article.description,
        "author": article.author,
        "user_id": article.user_id,
        "tags": article.tags,
    }
    if include_comments:
        d["comments"] = [
            {
                "id": c.id,
                "author": c.author,
                "description": c.description,
                "article_id": c.article_id,
                "user_id": c.user_id,
                "parent_id": c.parent_id,
            }
            for c in article.comments
        ]
    return d


@bp.route("/", methods=["GET"], strict_slashes=False)
def list_articles():
    articles = Article.query.order_by(Article.id).all()
    return jsonify({"articles": [_article_dict(a) for a in articles]}), 200


@bp.route("/", methods=["POST"], strict_slashes=False)
@login_required
def add():
    data = request.get_json() or {}
    title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    if not title:
        return jsonify({"error": "Title is required."}), 400
    tag_names = _parse_tags(data.get("tags", ""))
    article = Article(
        title=title,
        description=description,
        author=current_user.username,
        user_id=current_user.id,
        tag_objects=_resolve_tags(tag_names),
    )
    db.session.add(article)
    db.session.commit()
    logger.info("Added article %d: %s", article.id, title)
    return jsonify({"article": _article_dict(article)}), 201


@bp.route("/<int:article_id>", methods=["GET"])
def detail(article_id):
    article = db.session.get(Article, article_id)
    if not article:
        return jsonify({"error": "Article not found."}), 404
    return jsonify({"article": _article_dict(article, include_comments=True)}), 200


@bp.route("/<int:article_id>", methods=["PUT"])
@login_required
def update(article_id):
    article = db.session.get(Article, article_id)
    if not article:
        return jsonify({"error": "Article not found."}), 404
    if article.user_id and article.user_id != current_user.id:
        return jsonify({"error": "Not authorized."}), 403
    data = request.get_json() or {}
    title = data.get("title", "").strip()
    if not title:
        return jsonify({"error": "Title is required."}), 400
    article.title = title
    article.description = data.get("description", "").strip()
    article.tag_objects = _resolve_tags(_parse_tags(data.get("tags", "")))
    db.session.commit()
    logger.info("Updated article %d: %s", article_id, title)
    return jsonify({"article": _article_dict(article)}), 200


@bp.route("/<int:article_id>", methods=["DELETE"])
@login_required
def delete(article_id):
    article = db.session.get(Article, article_id)
    if not article:
        return jsonify({"error": "Article not found."}), 404
    if article.user_id and article.user_id != current_user.id:
        return jsonify({"error": "Not authorized."}), 403
    db.session.delete(article)
    db.session.commit()
    logger.info("Deleted article %d", article_id)
    return jsonify({"message": "Article deleted."}), 200
