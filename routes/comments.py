import logging

from flask import Blueprint, request, redirect, url_for

from models import db, Comment
from routes.articles import get_article

logger = logging.getLogger(__name__)

bp = Blueprint("comments", __name__, url_prefix="/articles/<int:article_id>/comments")


@bp.route("/add", methods=["POST"])
def add(article_id):
    article = get_article(article_id)
    if not article:
        logger.error("Article %d not found for comment", article_id)
        return redirect(url_for("articles.list"))
    author = request.form.get("author", "").strip()
    body = request.form.get("body", "").strip()
    if not body:
        logger.error("Attempted to add an empty comment to article %d", article_id)
        return redirect(url_for("articles.detail", article_id=article_id))
    comment = Comment(author=author or "Anonymous", body=body, article_id=article_id)
    db.session.add(comment)
    db.session.commit()
    logger.info("Added comment %d to article %d", comment.id, article_id)
    return redirect(url_for("articles.detail", article_id=article_id))


@bp.route("/delete/<int:comment_id>")
def delete(article_id, comment_id):
    article = get_article(article_id)
    if not article:
        logger.error("Article %d not found for comment deletion", article_id)
        return redirect(url_for("articles.list"))
    comment = db.session.get(Comment, comment_id)
    if not comment or comment.article_id != article_id:
        logger.error("Comment %d not found on article %d", comment_id, article_id)
    else:
        db.session.delete(comment)
        db.session.commit()
        logger.info("Deleted comment %d from article %d", comment_id, article_id)
    return redirect(url_for("articles.detail", article_id=article_id))
