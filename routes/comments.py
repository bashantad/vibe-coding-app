import logging

from flask import Blueprint, request, redirect, url_for
from flask_login import login_required, current_user

from models import db, Comment
from routes.articles import get_article

logger = logging.getLogger(__name__)

bp = Blueprint("comments", __name__, url_prefix="/articles/<int:article_id>/comments")


@bp.route("/add", methods=["POST"])
@login_required
def add(article_id):
    article = get_article(article_id)
    if not article:
        logger.error("Article %d not found for comment", article_id)
        return redirect(url_for("articles.list"))
    description = request.form.get("description", "").strip()
    if not description:
        logger.error("Attempted to add an empty comment to article %d", article_id)
        return redirect(url_for("articles.detail", article_id=article_id))
    comment = Comment(
        author=current_user.username,
        description=description,
        article_id=article_id,
        user_id=current_user.id,
    )
    db.session.add(comment)
    db.session.commit()
    logger.info("Added comment %d to article %d", comment.id, article_id)
    return redirect(url_for("articles.detail", article_id=article_id))


@bp.route("/delete/<int:comment_id>")
@login_required
def delete(article_id, comment_id):
    article = get_article(article_id)
    if not article:
        logger.error("Article %d not found for comment deletion", article_id)
        return redirect(url_for("articles.list"))
    comment = db.session.get(Comment, comment_id)
    if not comment or comment.article_id != article_id:
        logger.error("Comment %d not found on article %d", comment_id, article_id)
    elif comment.user_id and comment.user_id != current_user.id:
        logger.error("User %s not authorized to delete comment %d", current_user.username, comment_id)
    else:
        db.session.delete(comment)
        db.session.commit()
        logger.info("Deleted comment %d from article %d", comment_id, article_id)
    return redirect(url_for("articles.detail", article_id=article_id))
