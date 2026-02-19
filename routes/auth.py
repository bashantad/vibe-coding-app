import logging
import re

from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user

from models import db, User

logger = logging.getLogger(__name__)

bp = Blueprint("auth", __name__, url_prefix="/api")


def _user_dict(user):
    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "email": user.email,
    }


@bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()
    if not username or not password:
        return jsonify({"error": "Username and password are required."}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already taken."}), 409
    user = User(username=username)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    login_user(user)
    logger.info("User %s signed up", username)
    return jsonify({"user": _user_dict(user)}), 201


@bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()
    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid username or password."}), 401
    login_user(user)
    logger.info("User %s logged in", username)
    return jsonify({"user": _user_dict(user)}), 200


@bp.route("/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logged out."}), 200


@bp.route("/me", methods=["GET"])
def me():
    if current_user.is_authenticated:
        return jsonify({"user": _user_dict(current_user)}), 200
    return jsonify({"user": None}), 200


@bp.route("/profile", methods=["GET"])
@login_required
def profile_get():
    return jsonify({"user": _user_dict(current_user)}), 200


@bp.route("/profile", methods=["PUT"])
@login_required
def profile_put():
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    full_name = data.get("full_name", "").strip() or None
    email = data.get("email", "").strip() or None

    if not username:
        return jsonify({"error": "Username is required."}), 400

    if username != current_user.username:
        if User.query.filter_by(username=username).first():
            return jsonify({"error": "Username already taken."}), 409

    if email and not re.match(r"^[^@]+@[^@]+\.[^@]+$", email):
        return jsonify({"error": "Invalid email address."}), 400

    current_user.username = username
    current_user.full_name = full_name
    current_user.email = email
    db.session.commit()
    return jsonify({"user": _user_dict(current_user), "message": "Profile updated."}), 200
