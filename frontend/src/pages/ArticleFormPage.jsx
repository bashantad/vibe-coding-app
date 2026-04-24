import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { get, post, put } from '../api';
import { useAuth } from '../context/AuthContext';
import FlashMessage from '../components/FlashMessage';

export default function ArticleFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    async function loadCategories() {
      const { res, data } = await get('/api/categories');
      if (res.ok) setCategories(data.categories);
    }
    loadCategories();

    if (isEdit) {
      async function load() {
        const { res, data } = await get(`/api/articles/${id}`);
        if (res.ok) {
          setTitle(data.article.title);
          setDescription(data.article.description);
          setTags(data.article.tags.join(', '));
          setCategoryId(data.article.category_id ?? '');
        }
      }
      load();
    }
  }, [id, isEdit, user, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const body = { title, description, tags, category_id: categoryId || null };
    const { res, data } = isEdit
      ? await put(`/api/articles/${id}`, body)
      : await post('/api/articles', body);
    if (res.ok) {
      navigate('/articles');
    } else {
      setError(data.error);
    }
  }

  return (
    <div className="fade-in-up">
      <Link
        to="/articles"
        className="d-inline-flex align-items-center mb-3"
        style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--gray-500)' }}
      >
        &#8592; Back to Articles
      </Link>

      <Row className="justify-content-center">
        <Col md={8} lg={7}>
          <Card style={{ borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)' }}>
            <Card.Body style={{ padding: '2rem' }}>
              <h2 style={{ marginBottom: '0.25rem' }}>
                {isEdit ? 'Edit Article' : 'New Article'}
              </h2>
              <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                {isEdit ? 'Update your article details below' : 'Fill in the details to create a new article'}
              </p>

              <FlashMessage message={error} onDismiss={() => setError('')} />

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="articleTitle">
                  <Form.Label>Title</Form.Label>
                  <Form.Control
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Give your article a title"
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3" controlId="articleCategory">
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    <option value="">-- No category --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3" controlId="articleDescription">
                  <Form.Label>Content</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Write your article content here..."
                  />
                </Form.Group>
                <Form.Group className="mb-4" controlId="articleTags">
                  <Form.Label>Tags</Form.Label>
                  <Form.Control
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="e.g. react, javascript, tutorial"
                  />
                  <Form.Text className="text-muted">
                    Separate tags with commas
                  </Form.Text>
                </Form.Group>
                <div className="d-flex gap-2">
                  <Button type="submit" variant="primary" className="btn-lg">
                    {isEdit ? 'Save Changes' : 'Publish Article'}
                  </Button>
                  <Button
                    as={Link}
                    to="/articles"
                    variant="outline-secondary"
                    className="btn-lg"
                  >
                    Cancel
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
