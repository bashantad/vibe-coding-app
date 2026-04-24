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
    return (
      <div className="empty-state fade-in-up" style={{ marginTop: '3rem' }}>
        <div className="empty-state-icon">&#128274;</div>
        <h5>Login required</h5>
        <p>Please log in to use the URL shortener</p>
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
        <h2>URL Shortener</h2>
        <p>Create short, shareable links</p>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      <Form onSubmit={handleAdd} className="mb-4">
        <InputGroup>
          <FormControl
            name="original_url"
            placeholder="Paste a long URL here..."
            value={originalUrl}
            onChange={(e) => setOriginalUrl(e.target.value)}
            required
            style={{ fontSize: '0.95rem' }}
          />
          <Button type="submit" variant="primary">Shorten</Button>
        </InputGroup>
      </Form>

      {shortUrls.length > 0 ? (
        <ListGroup>
          {shortUrls.map((su) => (
            <ListGroup.Item key={su.id}>
              <div className="url-item">
                <div className="url-item-info">
                  <div className="url-item-title">
                    <a href={su.original_url} target="_blank" rel="noopener noreferrer">
                      {su.original_url}
                    </a>
                  </div>
                  <div className="d-flex align-items-center gap-2 mt-1">
                    <span className="url-item-meta">{su.short_url}</span>
                    <span className="stat-pill">
                      {su.click_count} click{su.click_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div className="d-flex gap-1 flex-shrink-0">
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
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">&#128279;</div>
          <h5>No short URLs yet</h5>
          <p>Paste a URL above to create your first short link</p>
        </div>
      )}
    </div>
  );
}
