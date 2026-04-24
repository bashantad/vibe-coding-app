import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { get, del } from '../api';
import { useAuth } from '../context/AuthContext';

export default function ArticlesPage() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const { user } = useAuth();

  async function fetchArticles() {
    const { data } = await get('/api/articles');
    setArticles(data.articles);
  }

  useEffect(() => {
    fetchArticles();
    async function fetchCategories() {
      const { res, data } = await get('/api/categories');
      if (res.ok) setCategories(data.categories);
    }
    fetchCategories();
  }, []);

  async function handleDelete(id) {
    await del(`/api/articles/${id}`);
    fetchArticles();
  }

  const filtered = categoryFilter
    ? articles.filter((a) => a.category_id === Number(categoryFilter))
    : articles;

  return (
    <div className="fade-in-up">
      <div className="page-header d-flex justify-content-between align-items-end">
        <div>
          <h2>Articles</h2>
          <p>Browse and manage your articles</p>
        </div>
        {user && (
          <Button as={Link} to="/articles/new" variant="primary">
            + New Article
          </Button>
        )}
      </div>

      <div className="filter-bar">
        <Form.Select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Form.Select>
        <span style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>
          {filtered.length} article{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filtered.length > 0 ? (
        <div className="d-flex flex-column gap-3">
          {filtered.map((art) => (
            <div key={art.id} className="article-card">
              <div className="d-flex justify-content-between align-items-start">
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="article-title">
                    <Link to={`/articles/${art.id}`}>{art.title}</Link>
                  </div>
                  <div className="article-meta">
                    by {art.author}
                    {art.category && (
                      <Badge bg="primary" className="ms-2">{art.category}</Badge>
                    )}
                    {art.tags.length > 0 && (
                      <span className="ms-2">
                        {art.tags.map((tag) => (
                          <Badge key={tag} bg="secondary" className="me-1">{tag}</Badge>
                        ))}
                      </span>
                    )}
                  </div>
                </div>
                {user && user.id === art.user_id && (
                  <div className="d-flex gap-1 ms-3 flex-shrink-0">
                    <Button
                      as={Link}
                      to={`/articles/edit/${art.id}`}
                      size="sm"
                      variant="outline-primary"
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleDelete(art.id)}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">&#128221;</div>
          <h5>No articles yet</h5>
          <p>Create your first article to get started</p>
        </div>
      )}
    </div>
  );
}
