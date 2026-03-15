import { useState, useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import ListGroup from 'react-bootstrap/ListGroup';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
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
    return <Alert variant="warning">Please log in to view your bookmarks.</Alert>;
  }

  if (loading) {
    return <Spinner animation="border" role="status"><span className="visually-hidden">Loading...</span></Spinner>;
  }

  return (
    <>
      <h2>Bookmarks</h2>
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      <Form onSubmit={handleAdd} className="mb-3">
        <InputGroup className="mb-2">
          <FormControl
            name="url"
            placeholder="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
        </InputGroup>
        <InputGroup className="mb-2">
          <FormControl
            name="title"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </InputGroup>
        <InputGroup className="mb-2">
          <FormControl
            name="description"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </InputGroup>
        <Button type="submit" variant="primary">Save Bookmark</Button>
      </Form>
      <ListGroup>
        {bookmarks.map((bm) => (
          <ListGroup.Item
            key={bm.id}
            className="d-flex justify-content-between align-items-start"
          >
            <div>
              <a href={bm.url} target="_blank" rel="noopener noreferrer">
                {bm.title}
              </a>
              {bm.description && (
                <div className="text-muted small">{bm.description}</div>
              )}
            </div>
            <Button
              size="sm"
              variant="outline-danger"
              onClick={() => handleDelete(bm.id)}
            >
              Delete
            </Button>
          </ListGroup.Item>
        ))}
        {bookmarks.length === 0 && (
          <ListGroup.Item className="text-muted">No bookmarks yet.</ListGroup.Item>
        )}
      </ListGroup>
    </>
  );
}
