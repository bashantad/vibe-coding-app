import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { useAuth } from '../context/AuthContext';
import FlashMessage from '../components/FlashMessage';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const result = await login(username, password);
    if (result.ok) {
      navigate('/');
    } else {
      setError(result.error);
    }
  }

  return (
    <Row className="justify-content-center fade-in-up" style={{ marginTop: '2rem' }}>
      <Col md={5} lg={4}>
        <Card className="auth-card">
          <Card.Header>
            <h2>Welcome back</h2>
            <p>Sign in to your account</p>
          </Card.Header>
          <Card.Body>
            <FlashMessage message={error} onDismiss={() => setError('')} />
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="loginUsername">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                />
              </Form.Group>
              <Form.Group className="mb-4" controlId="loginPassword">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </Form.Group>
              <Button type="submit" variant="primary" className="w-100 btn-lg mb-3">
                Sign In
              </Button>
            </Form>
            <p className="text-center mb-0" style={{ fontSize: '0.9rem', color: 'var(--gray-500)' }}>
              Don't have an account?{' '}
              <Link to="/signup" style={{ fontWeight: 600 }}>Create one</Link>
            </p>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}
