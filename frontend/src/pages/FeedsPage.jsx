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
    <div className="fade-in-up">
      <div className="page-header">
        <h2>Reddit Feeds</h2>
        <p>Latest posts from your favorite subreddits</p>
      </div>

      <div className="filter-bar">
        <Form.Select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort posts"
        >
          <option value="hot">Hot</option>
          <option value="new">New</option>
          <option value="top">Top</option>
        </Form.Select>

        <div className="d-flex flex-wrap gap-2">
          {SUBREDDITS.map((sub) => (
            <Badge
              key={sub}
              className={`badge-filter ${activeSubreddits.has(sub) ? 'active' : 'inactive'}`}
              role="button"
              onClick={() => toggleSubreddit(sub)}
            >
              r/{sub}
            </Badge>
          ))}
        </div>
      </div>

      {loading && (
        <div className="loading-state">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && !error && filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">&#128240;</div>
          <h5>No posts to display</h5>
          <p>Try selecting different subreddits or sorting options</p>
        </div>
      )}

      <Row xs={1} md={2} lg={3} className="g-3">
        {filtered.map((post, idx) => (
          <Col key={idx}>
            <Card className="feed-card h-100">
              <Card.Body>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <Badge bg="info">r/{post.subreddit}</Badge>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>
                    {timeAgo(post.created_utc)}
                  </span>
                </div>
                <Card.Title>
                  <a
                    href={`https://www.reddit.com${post.permalink}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {post.title}
                  </a>
                </Card.Title>
                {post.selftext && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', lineHeight: 1.5, marginBottom: 0 }}>
                    {post.selftext}
                  </p>
                )}
              </Card.Body>
              <Card.Footer className="d-flex justify-content-between align-items-center">
                <span className="stat-pill">&#9650; {post.score}</span>
                <span className="stat-pill">&#128172; {post.num_comments}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>
                  {post.author}
                </span>
              </Card.Footer>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
