import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { get, post, del } from '../api';
import { useAuth } from '../context/AuthContext';

export default function ChatbotPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    async function load() {
      const { res, data } = await get('/api/chat/messages');
      if (res.ok) {
        setMessages(data.messages);
      }
    }
    load();
  }, [user, navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    const content = input.trim();
    if (!content || loading) return;

    const optimistic = { id: 'temp', role: 'user', content, created_at: null };
    setMessages((prev) => [...prev, optimistic]);
    setInput('');
    setLoading(true);

    const { res, data } = await post('/api/chat/messages', { content });
    if (res.ok) {
      setMessages((prev) =>
        prev.filter((m) => m.id !== 'temp').concat(data.messages)
      );
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== 'temp'));
    }
    setLoading(false);
  }

  async function handleClear() {
    const { res } = await del('/api/chat/messages');
    if (res.ok) {
      setMessages([]);
    }
  }

  return (
    <Row className="justify-content-center">
      <Col md={8}>
        <Card className="shadow-sm">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h2 className="mb-0">Presentation Skills Coach</h2>
            {messages.length > 0 && (
              <Button variant="outline-danger" size="sm" onClick={handleClear}>
                Clear History
              </Button>
            )}
          </Card.Header>
          <Card.Body style={{ height: '60vh', overflowY: 'auto' }}>
            {messages.length === 0 && !loading && (
              <p className="text-muted text-center mt-4">
                Ask me anything about presentation skills!
              </p>
            )}
            {messages.map((msg, idx) => (
              <div
                key={msg.id || idx}
                className={`d-flex mb-2 ${msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
              >
                <div
                  className={`p-2 rounded ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-light text-dark'}`}
                  style={{ maxWidth: '75%' }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="d-flex justify-content-start mb-2">
                <Spinner animation="border" size="sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
              </div>
            )}
            <div ref={bottomRef} />
          </Card.Body>
          <Card.Footer>
            <Form onSubmit={handleSend} className="d-flex gap-2">
              <Form.Control
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={loading}
              />
              <Button type="submit" disabled={loading || !input.trim()}>
                Send
              </Button>
            </Form>
          </Card.Footer>
        </Card>
      </Col>
    </Row>
  );
}
