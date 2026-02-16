import logging

from flask import Blueprint, render_template, request, redirect, url_for

logger = logging.getLogger(__name__)

bp = Blueprint("todos", __name__)

todos = []
next_id = 1


@bp.route("/")
def index():
    return render_template("index.html", todos=todos)


@bp.route("/add", methods=["POST"])
def add():
    global next_id
    title = request.form.get("title", "").strip()
    author = request.form.get("author", "").strip()
    if not title:
        logger.error("Attempted to add a todo with an empty title")
        return redirect(url_for("todos.index"))
    todos.append({"id": next_id, "title": title, "author": author, "done": False})
    logger.info("Added todo %d: %s", next_id, title)
    next_id += 1
    return redirect(url_for("todos.index"))


@bp.route("/toggle/<int:todo_id>")
def toggle(todo_id):
    for todo in todos:
        if todo["id"] == todo_id:
            todo["done"] = not todo["done"]
            logger.info("Toggled todo %d to done=%s", todo_id, todo["done"])
            return redirect(url_for("todos.index"))
    logger.error("Todo %d not found for toggle", todo_id)
    return redirect(url_for("todos.index"))


@bp.route("/delete/<int:todo_id>")
def delete(todo_id):
    global todos
    before = len(todos)
    todos = [t for t in todos if t["id"] != todo_id]
    if len(todos) == before:
        logger.error("Todo %d not found for deletion", todo_id)
    else:
        logger.info("Deleted todo %d", todo_id)
    return redirect(url_for("todos.index"))
