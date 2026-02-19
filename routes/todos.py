import logging

from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user

from models import db, Todo

logger = logging.getLogger(__name__)

bp = Blueprint("todos", __name__, url_prefix="/api/todos")


def _todo_dict(todo):
    return {
        "id": todo.id,
        "title": todo.title,
        "author": todo.author,
        "done": todo.done,
        "user_id": todo.user_id,
    }


@bp.route("/", methods=["GET"], strict_slashes=False)
def index():
    todos = Todo.query.order_by(Todo.id).all()
    return jsonify({"todos": [_todo_dict(t) for t in todos]}), 200


@bp.route("/", methods=["POST"], strict_slashes=False)
@login_required
def add():
    data = request.get_json() or {}
    title = data.get("title", "").strip()
    if not title:
        return jsonify({"error": "Title is required."}), 400
    todo = Todo(title=title, author=current_user.username, user_id=current_user.id)
    db.session.add(todo)
    db.session.commit()
    logger.info("Added todo %d: %s", todo.id, title)
    return jsonify({"todo": _todo_dict(todo)}), 201


@bp.route("/<int:todo_id>/toggle", methods=["PATCH"])
@login_required
def toggle(todo_id):
    todo = db.session.get(Todo, todo_id)
    if not todo:
        return jsonify({"error": "Todo not found."}), 404
    if todo.user_id and todo.user_id != current_user.id:
        return jsonify({"error": "Not authorized."}), 403
    todo.done = not todo.done
    db.session.commit()
    logger.info("Toggled todo %d to done=%s", todo_id, todo.done)
    return jsonify({"todo": _todo_dict(todo)}), 200


@bp.route("/<int:todo_id>", methods=["DELETE"])
@login_required
def delete(todo_id):
    todo = db.session.get(Todo, todo_id)
    if not todo:
        return jsonify({"error": "Todo not found."}), 404
    if todo.user_id and todo.user_id != current_user.id:
        return jsonify({"error": "Not authorized."}), 403
    db.session.delete(todo)
    db.session.commit()
    logger.info("Deleted todo %d", todo_id)
    return jsonify({"message": "Todo deleted."}), 200
