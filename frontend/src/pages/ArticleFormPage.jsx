import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    <Row className="justify-content-center">
      <Col md={8}>
        <Card className="shadow-sm">
          <Card.Header as="h2" className="text-center">
            {isEdit ? 'Edit Article' : 'New Article'}
          </Card.Header>
          <Card.Body>
            <FlashMessage message={error} onDismiss={() => setError('')} />
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="articleTitle">
                <Form.Label>Title</Form.Label>
                <Form.Control
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
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
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="articleTags">
                <Form.Label>Tags (comma separated)</Form.Label>
                <Form.Control
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </Form.Group>
              <Button type="submit" variant="primary">
                {isEdit ? 'Update' : 'Create'}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}
