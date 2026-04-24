import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { get, put } from '../api';
import { useAuth } from '../context/AuthContext';
import FlashMessage from '../components/FlashMessage';

export default function ProfilePage() {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    async function load() {
      const { res, data } = await get('/api/profile');
      if (res.ok) {
        setUsername(data.user.username);
        setFullName(data.user.full_name || '');
        setEmail(data.user.email || '');
      }
    }
    load();
  }, [user, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    const { res, data } = await put('/api/profile', {
      username,
      full_name: fullName,
      email,
    });
    if (res.ok) {
      setSuccess(data.message);
      refreshUser();
    } else {
      setError(data.error);
    }
  }

  return (
    <Row className="justify-content-center fade-in-up" style={{ marginTop: '2rem' }}>
      <Col md={6} lg={5}>
        <Card className="auth-card">
          <Card.Header>
            <h2>Your Profile</h2>
            <p>Manage your account details</p>
          </Card.Header>
          <Card.Body>
            <FlashMessage message={error} onDismiss={() => setError('')} />
            <FlashMessage message={success} variant="success" onDismiss={() => setSuccess('')} />
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="profileUsername">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="profileFullName">
                <Form.Label>Full Name</Form.Label>
                <Form.Control
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                />
              </Form.Group>
              <Form.Group className="mb-4" controlId="profileEmail">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </Form.Group>
              <Button type="submit" variant="primary" className="w-100 btn-lg">
                Save Changes
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}
