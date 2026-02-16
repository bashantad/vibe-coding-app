import logging

from flask import Blueprint, render_template, request, redirect, url_for

from models import db, Article, Tag

logger = logging.getLogger(__name__)

bp = Blueprint("articles", __name__, url_prefix="/articles")


def get_article(article_id):
    return db.session.get(Article, article_id)


def _get_article_or_redirect(article_id, action="accessing"):
    article = get_article(article_id)
    if not article:
        logger.error("Article %d not found for %s", article_id, action)
        return None, redirect(url_for("articles.list"))
    return article, None


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


@bp.route("/", strict_slashes=False)
def list():
    articles = Article.query.order_by(Article.id).all()
    return render_template("articles_list.html", articles=articles)


@bp.route("/new")
def new():
    return render_template("articles_form.html", article=None)


@bp.route("/add", methods=["POST"])
def add():
    title = request.form.get("title", "").strip()
    description = request.form.get("description", "").strip()
    author = request.form.get("author", "").strip()
    if not title or not author:
        logger.error("Attempted to add an article with missing title or author")
        return redirect(url_for("articles.new"))
    tag_names = _parse_tags(request.form.get("tags", ""))
    article = Article(
        title=title,
        description=description,
        author=author,
        tag_objects=_resolve_tags(tag_names),
    )
    db.session.add(article)
    db.session.commit()
    logger.info("Added article %d: %s", article.id, title)
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
    article.title = title
    article.description = request.form.get("description", "").strip()
    article.author = request.form.get("author", "").strip()
    article.tag_objects = _resolve_tags(_parse_tags(request.form.get("tags", "")))
    db.session.commit()
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
    article = db.session.get(Article, article_id)
    if not article:
        logger.error("Article %d not found for deletion", article_id)
    else:
        db.session.delete(article)
        db.session.commit()
        logger.info("Deleted article %d", article_id)
    return redirect(url_for("articles.list"))
