import logging

from flask import Blueprint, request, redirect, url_for

from routes.articles import get_article

logger = logging.getLogger(__name__)

bp = Blueprint("comments", __name__, url_prefix="/articles/<int:article_id>/comments")

next_comment_id = 1


@bp.route("/add", methods=["POST"])
def add(article_id):
    global next_comment_id
    article = get_article(article_id)
    if not article:
        logger.error("Article %d not found for comment", article_id)
        return redirect(url_for("articles.list"))
    author = request.form.get("author", "").strip()
    body = request.form.get("body", "").strip()
    if not body:
        logger.error("Attempted to add an empty comment to article %d", article_id)
        return redirect(url_for("articles.detail", article_id=article_id))
    article["comments"].append({
        "id": next_comment_id,
        "author": author or "Anonymous",
        "body": body,
    })
    logger.info("Added comment %d to article %d", next_comment_id, article_id)
    next_comment_id += 1
    return redirect(url_for("articles.detail", article_id=article_id))


@bp.route("/delete/<int:comment_id>")
def delete(article_id, comment_id):
    article = get_article(article_id)
    if not article:
        logger.error("Article %d not found for comment deletion", article_id)
        return redirect(url_for("articles.list"))
    before = len(article["comments"])
    article["comments"] = [c for c in article["comments"] if c["id"] != comment_id]
    if len(article["comments"]) == before:
        logger.error("Comment %d not found on article %d", comment_id, article_id)
    else:
        logger.info("Deleted comment %d from article %d", comment_id, article_id)
    return redirect(url_for("articles.detail", article_id=article_id))
