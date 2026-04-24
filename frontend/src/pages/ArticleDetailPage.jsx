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
import CommentCard, { buildCommentTree } from '../components/CommentCard';

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
      <div className="loading-state">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  const tree = buildCommentTree(article.comments);

  return (
    <div className="fade-in-up">
      <Link
        to="/articles"
        className="d-inline-flex align-items-center mb-3"
        style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--gray-500)' }}
      >
        &#8592; Back to Articles
      </Link>

      <Card className="mb-4" style={{ borderRadius: 'var(--radius-xl)' }}>
        <Card.Body style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>{article.title}</h2>
          <div className="d-flex flex-wrap align-items-center gap-2 mb-3" style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
            <span>by <strong style={{ color: 'var(--gray-700)' }}>{article.author}</strong></span>
            {article.category && (
              <Badge bg="primary">{article.category}</Badge>
            )}
            {article.tags.map((tag) => (
              <Badge key={tag} bg="secondary">{tag}</Badge>
            ))}
          </div>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: 'var(--gray-700)' }}>
            {article.description}
          </p>
        </Card.Body>
      </Card>

      <div className="d-flex align-items-center gap-2 mb-3">
        <h4 style={{ margin: 0 }}>Comments</h4>
        <span className="stat-pill">{article.comments.length}</span>
      </div>

      <FlashMessage message={error} onDismiss={() => setError('')} />

      {tree.length > 0 ? (
        tree.map((c) => (
          <CommentCard
            key={c.id}
            comment={c}
            depth={0}
            user={user}
            articleId={id}
            onDelete={handleDeleteComment}
            onRefresh={fetchArticle}
          />
        ))
      ) : (
        <div className="empty-state" style={{ padding: '2rem' }}>
          <p style={{ color: 'var(--gray-400)', margin: 0 }}>No comments yet. Be the first to comment.</p>
        </div>
      )}

      {user && (
        <Card className="mt-3" style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)' }}>
          <Card.Body>
            <Form onSubmit={handleAddComment}>
              <Form.Group className="mb-3" controlId="addComment">
                <Form.Label style={{ fontWeight: 600 }}>Add a comment</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts..."
                  required
                />
              </Form.Group>
              <Button type="submit" variant="primary">Post Comment</Button>
            </Form>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}
