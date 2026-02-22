import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Badge from 'react-bootstrap/Badge';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { get, post, del } from '../api';
import { useAuth } from '../context/AuthContext';
import FlashMessage from '../components/FlashMessage';

export default function ArticleDetailPage() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();

  async function fetchArticle() {
    const { res, data } = await get(`/api/articles/${id}`);
    if (res.ok) {
      setArticle(data.article);
    }
  }

  useEffect(() => {
    fetchArticle();
  }, [id]);

  async function handleAddComment(e) {
    e.preventDefault();
    setError('');
    const { res, data } = await post(`/api/articles/${id}/comments`, { description: comment });
    if (res.ok) {
      setComment('');
      fetchArticle();
    } else {
      setError(data.error);
    }
  }

  async function handleDeleteComment(commentId) {
    await del(`/api/articles/${id}/comments/${commentId}`);
    fetchArticle();
  }

  if (!article) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <>
      <Card className="mb-4 shadow-sm">
        <Card.Header as="h2">{article.title}</Card.Header>
        <Card.Body>
          <p className="text-muted">by {article.author}</p>
          {article.tags.length > 0 && (
            <p>
              {article.tags.map((tag) => (
                <Badge key={tag} bg="secondary" className="me-1">{tag}</Badge>
              ))}
            </p>
          )}
          <p>{article.description}</p>
        </Card.Body>
      </Card>

      <h4>Comments</h4>
      <FlashMessage message={error} onDismiss={() => setError('')} />

      {article.comments.map((c) => (
        <Card key={c.id} className="mb-2">
          <Card.Body className="d-flex justify-content-between">
            <div>
              <strong>{c.author}</strong>: {c.description}
            </div>
            {user && (user.id === c.user_id || (!c.user_id)) && (
              <Button
                size="sm"
                variant="outline-danger"
                onClick={() => handleDeleteComment(c.id)}
              >
                Delete
              </Button>
            )}
          </Card.Body>
        </Card>
      ))}

      {user && (
        <Form onSubmit={handleAddComment} className="mt-3">
          <Form.Group className="mb-3" controlId="addComment">
            <Form.Label>Add Comment</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
          </Form.Group>
          <Button type="submit" variant="primary">Submit</Button>
        </Form>
      )}

      <Button as={Link} to="/articles" variant="outline-secondary" className="mt-3">
        Back to Articles
      </Button>
    </>
  );
}
