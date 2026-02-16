import logging

from flask import Blueprint, render_template, request, redirect, url_for
from flask_login import login_required, current_user

from models import db, Todo

logger = logging.getLogger(__name__)

bp = Blueprint("todos", __name__)


@bp.route("/")
def index():
    todos = Todo.query.order_by(Todo.id).all()
    return render_template("index.html", todos=todos)


@bp.route("/add", methods=["POST"])
@login_required
def add():
    title = request.form.get("title", "").strip()
    if not title:
        logger.error("Attempted to add a todo with an empty title")
        return redirect(url_for("todos.index"))
    todo = Todo(title=title, author=current_user.username, user_id=current_user.id)
    db.session.add(todo)
    db.session.commit()
    logger.info("Added todo %d: %s", todo.id, title)
    return redirect(url_for("todos.index"))


@bp.route("/toggle/<int:todo_id>")
@login_required
def toggle(todo_id):
    todo = db.session.get(Todo, todo_id)
    if not todo:
        logger.error("Todo %d not found for toggle", todo_id)
        return redirect(url_for("todos.index"))
    if todo.user_id and todo.user_id != current_user.id:
        logger.error("User %s not authorized to toggle todo %d", current_user.username, todo_id)
        return redirect(url_for("todos.index"))
    todo.done = not todo.done
    db.session.commit()
    logger.info("Toggled todo %d to done=%s", todo_id, todo.done)
    return redirect(url_for("todos.index"))


@bp.route("/delete/<int:todo_id>")
@login_required
def delete(todo_id):
    todo = db.session.get(Todo, todo_id)
    if not todo:
        logger.error("Todo %d not found for deletion", todo_id)
    elif todo.user_id and todo.user_id != current_user.id:
        logger.error("User %s not authorized to delete todo %d", current_user.username, todo_id)
    else:
        db.session.delete(todo)
        db.session.commit()
        logger.info("Deleted todo %d", todo_id)
    return redirect(url_for("todos.index"))
