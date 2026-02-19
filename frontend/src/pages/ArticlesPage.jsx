import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { get, del } from '../api';
import { useAuth } from '../context/AuthContext';

export default function ArticlesPage() {
  const [articles, setArticles] = useState([]);
  const { user } = useAuth();

  async function fetchArticles() {
    const { data } = await get('/api/articles');
    setArticles(data.articles);
  }

  useEffect(() => {
    fetchArticles();
  }, []);

  async function handleDelete(id) {
    await del(`/api/articles/${id}`);
    fetchArticles();
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Articles</h2>
        {user && (
          <Link to="/articles/new" className="btn btn-primary">+ New Article</Link>
        )}
      </div>
      <div className="list-group">
        {articles.map((art) => (
          <div key={art.id} className="list-group-item">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <Link to={`/articles/${art.id}`}>
                  <strong>{art.title}</strong>
                </Link>
                <small className="text-muted ms-2">by {art.author}</small>
                {art.tags.length > 0 && (
                  <span className="ms-2">
                    {art.tags.map((tag) => (
                      <span key={tag} className="badge bg-secondary me-1">{tag}</span>
                    ))}
                  </span>
                )}
              </div>
              {user && user.id === art.user_id && (
                <span>
                  <Link to={`/articles/edit/${art.id}`} className="btn btn-sm btn-outline-primary me-1">
                    Edit
                  </Link>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleDelete(art.id)}
                  >
                    Delete
                  </button>
                </span>
              )}
            </div>
          </div>
        ))}
        {articles.length === 0 && (
          <div className="list-group-item text-muted">No articles yet.</div>
        )}
      </div>
    </>
  );
}
