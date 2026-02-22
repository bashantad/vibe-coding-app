import { useState, useEffect } from 'react';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import Form from 'react-bootstrap/Form';
import { get, post, patch, del } from '../api';
import { useAuth } from '../context/AuthContext';
import FlashMessage from '../components/FlashMessage';

export default function TodosPage() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();

  async function fetchTodos() {
    const { data } = await get('/api/todos');
    setTodos(data.todos);
  }

  useEffect(() => {
    fetchTodos();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    const { res, data } = await post('/api/todos', { title });
    if (res.ok) {
      setTitle('');
      fetchTodos();
    } else {
      setError(data.error);
    }
  }

  async function handleToggle(id) {
    await patch(`/api/todos/${id}/toggle`);
    fetchTodos();
  }

  async function handleDelete(id) {
    await del(`/api/todos/${id}`);
    fetchTodos();
  }

  return (
    <>
      <h2>Todo App</h2>
      <FlashMessage message={error} onDismiss={() => setError('')} />
      {user && (
        <Form onSubmit={handleAdd} className="mb-3">
          <InputGroup>
            <FormControl
              name="title"
              placeholder="Add a new todo..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Button type="submit" variant="primary">Add</Button>
          </InputGroup>
        </Form>
      )}
      <ListGroup>
        {todos.map((todo) => (
          <ListGroup.Item
            key={todo.id}
            className="d-flex justify-content-between align-items-center"
          >
            <span style={{ textDecoration: todo.done ? 'line-through' : 'none' }}>
              {todo.title} <small className="text-muted">by {todo.author}</small>
            </span>
            {user && (
              <span>
                <Button
                  size="sm"
                  variant="outline-success"
                  className="me-1"
                  onClick={() => handleToggle(todo.id)}
                >
                  {todo.done ? 'Undo' : 'Done'}
                </Button>
                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={() => handleDelete(todo.id)}
                >
                  Delete
                </Button>
              </span>
            )}
          </ListGroup.Item>
        ))}
        {todos.length === 0 && (
          <ListGroup.Item className="text-muted">No todos yet.</ListGroup.Item>
        )}
      </ListGroup>
    </>
  );
}
