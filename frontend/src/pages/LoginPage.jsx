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
    <Row className="justify-content-center">
      <Col md={6}>
        <Card className="shadow-sm">
          <Card.Header as="h2" className="text-center">Login</Card.Header>
          <Card.Body>
            <FlashMessage message={error} onDismiss={() => setError('')} />
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="loginUsername">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="loginPassword">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Form.Group>
              <Button type="submit" variant="primary">Login</Button>
            </Form>
            <p className="mt-3">
              Don't have an account? <Link to="/signup">Sign Up</Link>
            </p>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}
