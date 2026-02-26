import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ListGroup from 'react-bootstrap/ListGroup';
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
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Articles</h2>
        {user && (
          <Button as={Link} to="/articles/new" variant="primary">+ New Article</Button>
        )}
      </div>
      <Form.Select
        className="mb-3"
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value)}
        style={{ maxWidth: '240px' }}
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </Form.Select>
      <ListGroup>
        {filtered.map((art) => (
          <ListGroup.Item
            key={art.id}
            className="d-flex justify-content-between align-items-center"
          >
            <div>
              <Link to={`/articles/${art.id}`}>
                <strong>{art.title}</strong>
              </Link>
              <small className="text-muted ms-2">by {art.author}</small>
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
            {user && user.id === art.user_id && (
              <span>
                <Button
                  as={Link}
                  to={`/articles/edit/${art.id}`}
                  size="sm"
                  variant="outline-primary"
                  className="me-1"
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
              </span>
            )}
          </ListGroup.Item>
        ))}
        {filtered.length === 0 && (
          <ListGroup.Item className="text-muted">No articles yet.</ListGroup.Item>
        )}
      </ListGroup>
    </>
  );
}
