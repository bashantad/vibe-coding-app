import json
import logging
import time
import urllib.request

from flask import Blueprint, jsonify, request

logger = logging.getLogger(__name__)

bp = Blueprint("feeds", __name__, url_prefix="/api/feeds")

SUBREDDITS = ["leadership", "management", "MachineLearning", "artificial"]
CACHE_TTL = 300  # 5 minutes
_cache = {}


def _fetch_subreddit(subreddit, sort):
    url = f"https://www.reddit.com/r/{subreddit}/{sort}.json?limit=15"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "claude-project-feeds/1.0"},
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode())
    posts = []
    for child in data.get("data", {}).get("children", []):
        p = child.get("data", {})
        selftext = p.get("selftext", "") or ""
        posts.append(
            {
                "title": p.get("title", ""),
                "url": p.get("url", ""),
                "permalink": p.get("permalink", ""),
                "subreddit": p.get("subreddit", subreddit),
                "author": p.get("author", ""),
                "score": p.get("score", 0),
                "num_comments": p.get("num_comments", 0),
                "created_utc": p.get("created_utc", 0),
                "thumbnail": p.get("thumbnail", ""),
                "selftext": selftext[:300],
            }
        )
    return posts


@bp.route("/", methods=["GET"], strict_slashes=False)
def list_feeds():
    sort = request.args.get("sort", "hot")
    if sort not in ("hot", "new", "top"):
        sort = "hot"

    cache_key = sort
    cached = _cache.get(cache_key)
    if cached and time.time() - cached["time"] < CACHE_TTL:
        return jsonify({"posts": cached["posts"]}), 200

    all_posts = []
    try:
        for sub in SUBREDDITS:
            try:
                all_posts.extend(_fetch_subreddit(sub, sort))
            except Exception:
                logger.warning("Failed to fetch r/%s", sub)
        if not all_posts:
            raise Exception("All subreddit fetches failed")
    except Exception:
        logger.exception("Failed to fetch feeds")
        return jsonify({"error": "Failed to fetch feeds."}), 502

    all_posts.sort(key=lambda p: p["score"], reverse=True)
    top_posts = all_posts[:50]

    _cache[cache_key] = {"time": time.time(), "posts": top_posts}

    return jsonify({"posts": top_posts}), 200
