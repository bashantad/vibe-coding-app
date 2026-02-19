import { useState, useEffect } from 'react';
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
        <form onSubmit={handleAdd} className="mb-3">
          <div className="input-group">
            <input
              className="form-control"
              name="title"
              placeholder="Add a new todo..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary">Add</button>
          </div>
        </form>
      )}
      <ul className="list-group">
        {todos.map((todo) => (
          <li key={todo.id} className="list-group-item d-flex justify-content-between align-items-center">
            <span style={{ textDecoration: todo.done ? 'line-through' : 'none' }}>
              {todo.title} <small className="text-muted">by {todo.author}</small>
            </span>
            {user && (
              <span>
                <button
                  className="btn btn-sm btn-outline-success me-1"
                  onClick={() => handleToggle(todo.id)}
                >
                  {todo.done ? 'Undo' : 'Done'}
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleDelete(todo.id)}
                >
                  Delete
                </button>
              </span>
            )}
          </li>
        ))}
        {todos.length === 0 && (
          <li className="list-group-item text-muted">No todos yet.</li>
        )}
      </ul>
    </>
  );
}
