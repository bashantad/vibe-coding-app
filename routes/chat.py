import logging
import os

from anthropic import Anthropic
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user

from models import db, ChatMessage

logger = logging.getLogger(__name__)

bp = Blueprint("chat", __name__, url_prefix="/api/chat")

SYSTEM_PROMPT = (
    "You are a friendly and knowledgeable presentation skills coach. "
    "Your expertise covers public speaking, slide design, storytelling, "
    "body language, audience engagement, handling Q&A sessions, overcoming "
    "stage fright, and structuring presentations effectively. Only answer "
    "questions related to presentation skills. If asked about unrelated "
    "topics, politely redirect the conversation back to presentation skills."
)

_client = None


def _get_client():
    global _client
    if _client is None:
        _client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
    return _client


def _message_dict(msg):
    return {
        "id": msg.id,
        "role": msg.role,
        "content": msg.content,
        "created_at": msg.created_at.isoformat() if msg.created_at else None,
    }


@bp.route("/messages", methods=["GET"], strict_slashes=False)
@login_required
def get_messages():
    messages = (
        ChatMessage.query
        .filter_by(user_id=current_user.id)
        .order_by(ChatMessage.created_at)
        .all()
    )
    return jsonify({"messages": [_message_dict(m) for m in messages]}), 200


@bp.route("/messages", methods=["POST"], strict_slashes=False)
@login_required
def send_message():
    data = request.get_json() or {}
    content = data.get("content", "").strip()
    if not content:
        return jsonify({"error": "Content is required."}), 400

    user_msg = ChatMessage(
        user_id=current_user.id,
        role="user",
        content=content,
    )
    db.session.add(user_msg)
    db.session.commit()

    history = (
        ChatMessage.query
        .filter_by(user_id=current_user.id)
        .order_by(ChatMessage.created_at)
        .all()
    )
    conversation = [{"role": m.role, "content": m.content} for m in history]

    try:
        response = _get_client().messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=conversation,
        )
        assistant_content = response.content[0].text
    except Exception:
        logger.exception("Claude API error")
        return jsonify({"error": "Failed to get response from AI."}), 502

    assistant_msg = ChatMessage(
        user_id=current_user.id,
        role="assistant",
        content=assistant_content,
    )
    db.session.add(assistant_msg)
    db.session.commit()

    return jsonify({
        "messages": [_message_dict(user_msg), _message_dict(assistant_msg)],
    }), 201


@bp.route("/messages", methods=["DELETE"], strict_slashes=False)
@login_required
def clear_messages():
    ChatMessage.query.filter_by(user_id=current_user.id).delete()
    db.session.commit()
    logger.info("Cleared chat history for user %d", current_user.id)
    return jsonify({"message": "Chat history cleared."}), 200
