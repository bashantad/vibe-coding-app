import logging
import random
import string

from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user

from models import db, ShortUrl

logger = logging.getLogger(__name__)

bp = Blueprint("shortener", __name__, url_prefix="/api/shortener")


def _generate_short_code(length=6):
    chars = string.ascii_letters + string.digits
    while True:
        code = "".join(random.choices(chars, k=length))
        if not ShortUrl.query.filter_by(short_code=code).first():
            return code


def _short_url_dict(short_url):
    return {
        "id": short_url.id,
        "short_code": short_url.short_code,
        "original_url": short_url.original_url,
        "short_url": f"/s/{short_url.short_code}",
        "click_count": short_url.click_count,
        "user_id": short_url.user_id,
        "created_at": short_url.created_at.isoformat() if short_url.created_at else None,
    }


@bp.route("/", methods=["GET"], strict_slashes=False)
@login_required
def index():
    urls = (
        ShortUrl.query.filter_by(user_id=current_user.id)
        .order_by(ShortUrl.created_at.desc())
        .all()
    )
    return jsonify({"short_urls": [_short_url_dict(u) for u in urls]}), 200


@bp.route("/", methods=["POST"], strict_slashes=False)
@login_required
def add():
    data = request.get_json() or {}
    original_url = data.get("original_url", "").strip()

    if not original_url:
        return jsonify({"error": "URL is required."}), 400

    short_url = ShortUrl(
        short_code=_generate_short_code(),
        original_url=original_url,
        user_id=current_user.id,
    )
    db.session.add(short_url)
    db.session.commit()
    logger.info("Created short URL %s -> %s", short_url.short_code, original_url)
    return jsonify({"short_url": _short_url_dict(short_url)}), 201


@bp.route("/<int:short_url_id>", methods=["DELETE"])
@login_required
def delete(short_url_id):
    short_url = db.session.get(ShortUrl, short_url_id)
    if not short_url:
        return jsonify({"error": "Short URL not found."}), 404
    if short_url.user_id != current_user.id:
        return jsonify({"error": "Not authorized."}), 403
    db.session.delete(short_url)
    db.session.commit()
    logger.info("Deleted short URL %d", short_url_id)
    return jsonify({"message": "Short URL deleted."}), 200
