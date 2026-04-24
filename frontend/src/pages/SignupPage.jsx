import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { useAuth } from '../context/AuthContext';
import FlashMessage from '../components/FlashMessage';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const result = await signup(username, password);
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
            <h2>Create account</h2>
            <p>Get started for free</p>
          </Card.Header>
          <Card.Body>
            <FlashMessage message={error} onDismiss={() => setError('')} />
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="signupUsername">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  required
                />
              </Form.Group>
              <Form.Group className="mb-4" controlId="signupPassword">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                />
              </Form.Group>
              <Button type="submit" variant="primary" className="w-100 btn-lg mb-3">
                Create Account
              </Button>
            </Form>
            <p className="text-center mb-0" style={{ fontSize: '0.9rem', color: 'var(--gray-500)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link>
            </p>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}
