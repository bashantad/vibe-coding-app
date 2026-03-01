import json
from unittest.mock import MagicMock, patch


def _reddit_response(subreddit, posts):
    """Build a mock Reddit JSON response."""
    children = []
    for p in posts:
        children.append(
            {
                "kind": "t3",
                "data": {
                    "title": p.get("title", "Test Post"),
                    "url": p.get("url", "https://example.com"),
                    "permalink": p.get("permalink", f"/r/{subreddit}/comments/abc/test/"),
                    "subreddit": subreddit,
                    "author": p.get("author", "testuser"),
                    "score": p.get("score", 10),
                    "num_comments": p.get("num_comments", 5),
                    "created_utc": p.get("created_utc", 1700000000),
                    "thumbnail": p.get("thumbnail", ""),
                    "selftext": p.get("selftext", ""),
                },
            }
        )
    return json.dumps({"data": {"children": children}}).encode()


def _mock_urlopen(subreddit_posts):
    """Return a side_effect function for urlopen that returns appropriate data per subreddit."""

    def side_effect(req, **kwargs):
        url = req.full_url if hasattr(req, "full_url") else str(req)
        for sub, posts in subreddit_posts.items():
            if f"/r/{sub}/" in url:
                resp = MagicMock()
                resp.read.return_value = _reddit_response(sub, posts)
                resp.__enter__ = lambda s: s
                resp.__exit__ = MagicMock(return_value=False)
                return resp
        raise Exception(f"Unexpected URL: {url}")

    return side_effect


class TestListFeeds:
    @patch("routes.feeds._cache", {})
    @patch("routes.feeds.urllib.request.urlopen")
    def test_returns_posts(self, mock_urlopen, client):
        mock_urlopen.side_effect = _mock_urlopen(
            {
                "leadership": [{"title": "Lead well", "score": 50}],
                "management": [{"title": "Manage teams", "score": 30}],
                "MachineLearning": [{"title": "New ML paper", "score": 100}],
                "artificial": [{"title": "AI news", "score": 20}],
            }
        )

        resp = client.get("/api/feeds")
        assert resp.status_code == 200
        data = resp.get_json()
        assert "posts" in data
        assert len(data["posts"]) == 4
        # Sorted by score descending
        assert data["posts"][0]["title"] == "New ML paper"
        assert data["posts"][0]["score"] == 100
        assert data["posts"][-1]["title"] == "AI news"

    @patch("routes.feeds._cache", {})
    @patch("routes.feeds.urllib.request.urlopen")
    def test_handles_reddit_failure(self, mock_urlopen, client):
        mock_urlopen.side_effect = Exception("Connection refused")

        resp = client.get("/api/feeds")
        assert resp.status_code == 502
        assert resp.get_json()["error"] == "Failed to fetch feeds."

    @patch("routes.feeds._cache", {})
    @patch("routes.feeds.urllib.request.urlopen")
    def test_respects_sort_param(self, mock_urlopen, client):
        mock_urlopen.side_effect = _mock_urlopen(
            {
                "leadership": [{"title": "Post 1", "score": 10}],
                "management": [{"title": "Post 2", "score": 20}],
                "MachineLearning": [{"title": "Post 3", "score": 30}],
                "artificial": [{"title": "Post 4", "score": 40}],
            }
        )

        resp = client.get("/api/feeds?sort=new")
        assert resp.status_code == 200
        # Verify the URL contained /new.json
        calls = mock_urlopen.call_args_list
        for call in calls:
            req = call[0][0]
            assert "/new.json" in req.full_url

    @patch("routes.feeds._cache", {})
    @patch("routes.feeds.urllib.request.urlopen")
    def test_returns_max_50_posts(self, mock_urlopen, client):
        # Each subreddit returns 15 posts = 60 total, should be capped to 50
        mock_urlopen.side_effect = _mock_urlopen(
            {
                sub: [{"title": f"Post {i}", "score": i} for i in range(15)]
                for sub in ["leadership", "management", "MachineLearning", "artificial"]
            }
        )

        resp = client.get("/api/feeds")
        assert resp.status_code == 200
        assert len(resp.get_json()["posts"]) == 50
