import logging

from flask import Blueprint, render_template, request, redirect, url_for

logger = logging.getLogger(__name__)

bp = Blueprint("articles", __name__, url_prefix="/articles")

articles = []
next_article_id = 1


def get_article(article_id):
    return next((a for a in articles if a["id"] == article_id), None)


def _get_article_or_redirect(article_id, action="accessing"):
    article = get_article(article_id)
    if not article:
        logger.error("Article %d not found for %s", article_id, action)
        return None, redirect(url_for("articles.list"))
    return article, None


def _parse_tags(tags_raw):
    return [t.strip() for t in tags_raw.split(",") if t.strip()]



@bp.route("/", strict_slashes=False)
def list():
    return render_template("articles_list.html", articles=articles)


@bp.route("/new")
def new():
    return render_template("articles_form.html", article=None)


@bp.route("/add", methods=["POST"])
def add():
    global next_article_id
    title = request.form.get("title", "").strip()
    description = request.form.get("description", "").strip()
    author = request.form.get("author", "").strip()
    if not title or not author:
        logger.error("Attempted to add an article with missing title or author")
        return redirect(url_for("articles.new"))
    tags = _parse_tags(request.form.get("tags", ""))
    articles.append({
        "id": next_article_id,
        "title": title,
        "description": description,
        "author": author,
        "tags": tags,
        "comments": [],
    })
    logger.info("Added article %d: %s", next_article_id, title)
    next_article_id += 1
    return redirect(url_for("articles.list"))


@bp.route("/edit/<int:article_id>")
def edit(article_id):
    article, err = _get_article_or_redirect(article_id, "editing")
    if err:
        return err
    return render_template("articles_form.html", article=article)


@bp.route("/update/<int:article_id>", methods=["POST"])
def update(article_id):
    article, err = _get_article_or_redirect(article_id, "update")
    if err:
        return err
    title = request.form.get("title", "").strip()
    if not title:
        logger.error("Attempted to update article %d with an empty title", article_id)
        return redirect(url_for("articles.edit", article_id=article_id))
    article["title"] = title
    article["description"] = request.form.get("description", "").strip()
    article["author"] = request.form.get("author", "").strip()
    article["tags"] = _parse_tags(request.form.get("tags", ""))
    logger.info("Updated article %d: %s", article_id, title)
    return redirect(url_for("articles.list"))


@bp.route("/<int:article_id>")
def detail(article_id):
    article, err = _get_article_or_redirect(article_id, "viewing")
    if err:
        return err
    return render_template("articles_detail.html", article=article)


@bp.route("/delete/<int:article_id>")
def delete(article_id):
    global articles
    before = len(articles)
    articles = [a for a in articles if a["id"] != article_id]
    if len(articles) == before:
        logger.error("Article %d not found for deletion", article_id)
    else:
        logger.info("Deleted article %d", article_id)
    return redirect(url_for("articles.list"))
