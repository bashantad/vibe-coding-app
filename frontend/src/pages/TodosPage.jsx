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

  const doneCount = todos.filter((t) => t.done).length;

  return (
    <div className="fade-in-up">
      <div className="page-header d-flex justify-content-between align-items-end">
        <div>
          <h2>Todos</h2>
          <p>Stay organized and get things done</p>
        </div>
        {todos.length > 0 && (
          <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>
            <span style={{ fontWeight: 600, color: 'var(--gray-700)' }}>{doneCount}</span>
            {' / '}{todos.length} completed
          </div>
        )}
      </div>

      <FlashMessage message={error} onDismiss={() => setError('')} />

      {user && (
        <Form onSubmit={handleAdd} className="mb-4">
          <InputGroup>
            <FormControl
              name="title"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ fontSize: '0.95rem' }}
            />
            <Button type="submit" variant="primary">Add Todo</Button>
          </InputGroup>
        </Form>
      )}

      {todos.length > 0 ? (
        <ListGroup>
          {todos.map((todo) => (
            <ListGroup.Item
              key={todo.id}
              className="d-flex align-items-center"
              style={{ gap: '0.75rem' }}
            >
              {user && (
                <div
                  className={`todo-checkbox ${todo.done ? 'checked' : ''}`}
                  onClick={() => handleToggle(todo.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={todo.done ? 'Mark undone' : 'Mark done'}
                />
              )}
              <div className="flex-grow-1" style={{ minWidth: 0 }}>
                <span className={`todo-text ${todo.done ? 'done' : ''}`}>
                  {todo.title}
                </span>
                <span className="todo-author d-block">by {todo.author}</span>
              </div>
              {user && (
                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={() => handleDelete(todo.id)}
                >
                  Delete
                </Button>
              )}
            </ListGroup.Item>
          ))}
        </ListGroup>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">&#9744;</div>
          <h5>No todos yet</h5>
          <p>Add your first todo above to get started</p>
        </div>
      )}
    </div>
  );
}
