import logging
import re

from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required, current_user

from models import db, User

logger = logging.getLogger(__name__)

bp = Blueprint("auth", __name__)


@bp.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "").strip()
        if not username or not password:
            flash("Username and password are required.", "danger")
            return redirect(url_for("auth.signup"))
        if User.query.filter_by(username=username).first():
            flash("Username already taken.", "danger")
            return redirect(url_for("auth.signup"))
        user = User(username=username)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        login_user(user)
        logger.info("User %s signed up", username)
        return redirect(url_for("todos.index"))
    return render_template("auth_signup.html")


@bp.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "").strip()
        user = User.query.filter_by(username=username).first()
        if not user or not user.check_password(password):
            flash("Invalid username or password.", "danger")
            return redirect(url_for("auth.login"))
        login_user(user)
        logger.info("User %s logged in", username)
        next_page = request.args.get("next")
        return redirect(next_page or url_for("todos.index"))
    return render_template("auth_login.html")


@bp.route("/profile", methods=["GET", "POST"])
@login_required
def profile():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        full_name = request.form.get("full_name", "").strip() or None
        email = request.form.get("email", "").strip() or None

        if not username:
            flash("Username is required.", "danger")
            return redirect(url_for("auth.profile"))

        if username != current_user.username:
            if User.query.filter_by(username=username).first():
                flash("Username already taken.", "danger")
                return redirect(url_for("auth.profile"))

        if email and not re.match(r"^[^@]+@[^@]+\.[^@]+$", email):
            flash("Invalid email address.", "danger")
            return redirect(url_for("auth.profile"))

        current_user.username = username
        current_user.full_name = full_name
        current_user.email = email
        db.session.commit()
        flash("Profile updated.", "success")
        return redirect(url_for("auth.profile"))

    return render_template("profile.html")


@bp.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("todos.index"))
