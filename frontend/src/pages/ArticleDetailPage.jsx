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

function buildCommentTree(comments) {
  const map = {};
  const roots = [];
  comments.forEach((c) => {
    map[c.id] = { ...c, replies: [] };
  });
  comments.forEach((c) => {
    if (c.parent_id && map[c.parent_id]) {
      map[c.parent_id].replies.push(map[c.id]);
    } else {
      roots.push(map[c.id]);
    }
  });
  return roots;
}

function CommentCard({ comment, depth, user, articleId, onDelete, onRefresh }) {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [error, setError] = useState('');

  async function handleReply(e) {
    e.preventDefault();
    setError('');
    const { res, data } = await post(`/api/articles/${articleId}/comments`, {
      description: replyText,
      parent_id: comment.id,
    });
    if (res.ok) {
      setReplyText('');
      setReplying(false);
      onRefresh();
    } else {
      setError(data.error);
    }
  }

  return (
    <div style={{ marginLeft: depth * 32 }}>
      <Card className="mb-2">
        <Card.Body>
          <div className="d-flex justify-content-between">
            <div>
              <strong>{comment.author}</strong>: {comment.description}
            </div>
            <div>
              {user && (
                <Button
                  size="sm"
                  variant="outline-secondary"
                  className="me-1"
                  onClick={() => setReplying(!replying)}
                >
                  Reply
                </Button>
              )}
              {user && (user.id === comment.user_id || !comment.user_id) && (
                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={() => onDelete(comment.id)}
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
          {replying && (
            <Form onSubmit={handleReply} className="mt-2">
              <FlashMessage message={error} onDismiss={() => setError('')} />
              <Form.Control
                as="textarea"
                rows={2}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                required
                className="mb-2"
              />
              <Button type="submit" size="sm" variant="primary" className="me-1">
                Submit
              </Button>
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() => setReplying(false)}
              >
                Cancel
              </Button>
            </Form>
          )}
        </Card.Body>
      </Card>
      {comment.replies.map((reply) => (
        <CommentCard
          key={reply.id}
          comment={reply}
          depth={depth + 1}
          user={user}
          articleId={articleId}
          onDelete={onDelete}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}

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

  const tree = buildCommentTree(article.comments);

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

      {tree.map((c) => (
        <CommentCard
          key={c.id}
          comment={c}
          depth={0}
          user={user}
          articleId={id}
          onDelete={handleDeleteComment}
          onRefresh={fetchArticle}
        />
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
