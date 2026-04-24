import { useState, useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import ListGroup from 'react-bootstrap/ListGroup';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Card from 'react-bootstrap/Card';
import { get, post, del } from '../api';
import { useAuth } from '../context/AuthContext';

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const { user } = useAuth();

  async function fetchBookmarks() {
    setLoading(true);
    try {
      const { res, data } = await get('/api/bookmarks');
      if (res.ok) {
        setBookmarks(data.bookmarks);
      } else {
        setError(data.error || 'Failed to load bookmarks.');
      }
    } catch {
      setError('Failed to load bookmarks.');
    }
    setLoading(false);
  }

  useEffect(() => {
    if (user) {
      fetchBookmarks();
    } else {
      setLoading(false);
    }
  }, [user]);

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    const { res, data } = await post('/api/bookmarks', { url, title, description });
    if (res.ok) {
      setUrl('');
      setTitle('');
      setDescription('');
      fetchBookmarks();
    } else {
      setError(data.error);
    }
  }

  async function handleDelete(id) {
    await del(`/api/bookmarks/${id}`);
    fetchBookmarks();
  }

  if (!user) {
    return (
      <div className="empty-state fade-in-up" style={{ marginTop: '3rem' }}>
        <div className="empty-state-icon">&#128274;</div>
        <h5>Login required</h5>
        <p>Please log in to view and manage your bookmarks</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-state">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div className="fade-in-up">
      <div className="page-header">
        <h2>Bookmarks</h2>
        <p>Save and organize your favorite links</p>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      <Card className="mb-4" style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)' }}>
        <Card.Body>
          <h6 style={{ fontWeight: 700, marginBottom: '0.75rem', color: 'var(--gray-700)' }}>
            Add a bookmark
          </h6>
          <Form onSubmit={handleAdd}>
            <div className="d-flex flex-column flex-md-row gap-2 mb-2">
              <Form.Control
                name="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                style={{ flex: 2 }}
              />
              <Form.Control
                name="title"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{ flex: 1 }}
              />
            </div>
            <div className="d-flex gap-2">
              <Form.Control
                name="description"
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ flex: 1 }}
              />
              <Button type="submit" variant="primary" className="flex-shrink-0">
                Save
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {bookmarks.length > 0 ? (
        <ListGroup>
          {bookmarks.map((bm) => (
            <ListGroup.Item key={bm.id}>
              <div className="url-item">
                <div className="url-item-info">
                  <div className="url-item-title">
                    <a href={bm.url} target="_blank" rel="noopener noreferrer">
                      {bm.title}
                    </a>
                  </div>
                  {bm.description && (
                    <div className="url-item-desc">{bm.description}</div>
                  )}
                  <div className="url-item-meta">{bm.url}</div>
                </div>
                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={() => handleDelete(bm.id)}
                >
                  Delete
                </Button>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">&#128278;</div>
          <h5>No bookmarks yet</h5>
          <p>Save your first bookmark above to get started</p>
        </div>
      )}
    </div>
  );
}
