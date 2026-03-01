import { useState, useEffect } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Badge from 'react-bootstrap/Badge';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { get } from '../api';

const SUBREDDITS = ['leadership', 'management', 'MachineLearning', 'artificial'];

function timeAgo(utc) {
  const seconds = Math.floor(Date.now() / 1000 - utc);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function FeedsPage() {
  const [posts, setPosts] = useState([]);
  const [sort, setSort] = useState('hot');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSubreddits, setActiveSubreddits] = useState(new Set(SUBREDDITS));

  useEffect(() => {
    async function fetchFeeds() {
      setLoading(true);
      setError('');
      const { res, data } = await get(`/api/feeds?sort=${sort}`);
      if (res.ok) {
        setPosts(data.posts);
      } else {
        setError(data.error || 'Failed to fetch feeds.');
      }
      setLoading(false);
    }
    fetchFeeds();
  }, [sort]);

  function toggleSubreddit(sub) {
    setActiveSubreddits((prev) => {
      const next = new Set(prev);
      if (next.has(sub)) {
        next.delete(sub);
      } else {
        next.add(sub);
      }
      return next;
    });
  }

  const filtered = posts.filter((p) => activeSubreddits.has(p.subreddit));

  return (
    <>
      <h2 className="mb-3">Reddit Feeds</h2>

      <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
        <Form.Select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{ maxWidth: '160px' }}
          aria-label="Sort posts"
        >
          <option value="hot">Hot</option>
          <option value="new">New</option>
          <option value="top">Top</option>
        </Form.Select>

        <div className="d-flex flex-wrap gap-1">
          {SUBREDDITS.map((sub) => (
            <Badge
              key={sub}
              bg={activeSubreddits.has(sub) ? 'primary' : 'secondary'}
              role="button"
              onClick={() => toggleSubreddit(sub)}
              style={{ cursor: 'pointer' }}
            >
              r/{sub}
            </Badge>
          ))}
        </div>
      </div>

      {loading && (
        <div className="text-center my-4">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && !error && filtered.length === 0 && (
        <p className="text-muted">No posts to display.</p>
      )}

      <Row xs={1} md={2} lg={3} className="g-3">
        {filtered.map((post, idx) => (
          <Col key={idx}>
            <Card className="h-100 shadow-sm">
              <Card.Body>
                <div className="mb-2">
                  <Badge bg="info" className="me-1">r/{post.subreddit}</Badge>
                  <small className="text-muted">
                    by {post.author} &middot; {timeAgo(post.created_utc)}
                  </small>
                </div>
                <Card.Title className="fs-6">
                  <a
                    href={`https://www.reddit.com${post.permalink}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {post.title}
                  </a>
                </Card.Title>
                {post.selftext && (
                  <Card.Text className="small text-muted">
                    {post.selftext}
                  </Card.Text>
                )}
              </Card.Body>
              <Card.Footer className="d-flex justify-content-between small">
                <span>Score: {post.score}</span>
                <span>Comments: {post.num_comments}</span>
              </Card.Footer>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );
}
