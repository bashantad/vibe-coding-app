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

export default function ShortenerPage() {
  const [shortUrls, setShortUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [originalUrl, setOriginalUrl] = useState('');
  const [copied, setCopied] = useState(null);
  const { user } = useAuth();

  async function fetchShortUrls() {
    setLoading(true);
    try {
      const { res, data } = await get('/api/shortener');
      if (res.ok) {
        setShortUrls(data.short_urls);
      } else {
        setError(data.error || 'Failed to load short URLs.');
      }
    } catch {
      setError('Failed to load short URLs.');
    }
    setLoading(false);
  }

  useEffect(() => {
    if (user) {
      fetchShortUrls();
    } else {
      setLoading(false);
    }
  }, [user]);

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    const { res, data } = await post('/api/shortener', { original_url: originalUrl });
    if (res.ok) {
      setOriginalUrl('');
      fetchShortUrls();
    } else {
      setError(data.error);
    }
  }

  async function handleDelete(id) {
    await del(`/api/shortener/${id}`);
    fetchShortUrls();
  }

  async function handleCopy(shortUrl) {
    const fullUrl = `${window.location.origin}${shortUrl}`;
    await navigator.clipboard.writeText(fullUrl);
    setCopied(shortUrl);
    setTimeout(() => setCopied(null), 2000);
  }

  if (!user) {
    return <Alert variant="warning">Please log in to use the URL shortener.</Alert>;
  }

  if (loading) {
    return <Spinner animation="border" role="status"><span className="visually-hidden">Loading...</span></Spinner>;
  }

  return (
    <>
      <h2>URL Shortener</h2>
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      <Form onSubmit={handleAdd} className="mb-3">
        <InputGroup>
          <FormControl
            name="original_url"
            placeholder="Enter URL to shorten"
            value={originalUrl}
            onChange={(e) => setOriginalUrl(e.target.value)}
            required
          />
          <Button type="submit" variant="primary">Shorten</Button>
        </InputGroup>
      </Form>
      <ListGroup>
        {shortUrls.map((su) => (
          <ListGroup.Item
            key={su.id}
            className="d-flex justify-content-between align-items-start"
          >
            <div className="me-3" style={{ minWidth: 0, flex: 1 }}>
              <div className="text-truncate">
                <a href={su.original_url} target="_blank" rel="noopener noreferrer">
                  {su.original_url}
                </a>
              </div>
              <div className="text-muted small">
                {su.short_url} &middot; {su.click_count} click{su.click_count !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="d-flex gap-1">
              <Button
                size="sm"
                variant={copied === su.short_url ? 'success' : 'outline-secondary'}
                onClick={() => handleCopy(su.short_url)}
              >
                {copied === su.short_url ? 'Copied!' : 'Copy'}
              </Button>
              <Button
                size="sm"
                variant="outline-danger"
                onClick={() => handleDelete(su.id)}
              >
                Delete
              </Button>
            </div>
          </ListGroup.Item>
        ))}
        {shortUrls.length === 0 && (
          <ListGroup.Item className="text-muted">No short URLs yet.</ListGroup.Item>
        )}
      </ListGroup>
    </>
  );
}
