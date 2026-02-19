import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
    return <p>Loading...</p>;
  }

  return (
    <>
      <h2>{article.title}</h2>
      <p className="text-muted">by {article.author}</p>
      {article.tags.length > 0 && (
        <p>
          {article.tags.map((tag) => (
            <span key={tag} className="badge bg-secondary me-1">{tag}</span>
          ))}
        </p>
      )}
      <p>{article.description}</p>

      <hr />
      <h4>Comments</h4>
      <FlashMessage message={error} onDismiss={() => setError('')} />

      {article.comments.map((c) => (
        <div key={c.id} className="card mb-2">
          <div className="card-body d-flex justify-content-between">
            <div>
              <strong>{c.author}</strong>: {c.description}
            </div>
            {user && (user.id === c.user_id || (!c.user_id)) && (
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => handleDeleteComment(c.id)}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      ))}

      {user && (
        <form onSubmit={handleAddComment} className="mt-3">
          <div className="mb-3">
            <label className="form-label">Add Comment</label>
            <textarea
              className="form-control"
              rows="2"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">Submit</button>
        </form>
      )}

      <Link to="/articles" className="btn btn-outline-secondary mt-3">Back to Articles</Link>
    </>
  );
}
