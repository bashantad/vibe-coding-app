import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TodosPage from '../TodosPage';
import { renderWithProviders, createMockUser, createMockTodo } from '../../test/helpers';
import { get, post, patch, del } from '../../api';

vi.mock('../../api');

describe('TodosPage', () => {
  beforeEach(() => {
    get.mockResolvedValue({ data: { todos: [] } });
  });

  it('fetches and displays todos', async () => {
    get.mockResolvedValue({
      data: {
        todos: [
          createMockTodo({ id: 1, title: 'Buy milk', author: 'alice' }),
          createMockTodo({ id: 2, title: 'Walk dog', author: 'bob', done: true }),
        ],
      },
    });
    renderWithProviders(<TodosPage />);

    await waitFor(() => {
      expect(screen.getByText(/Buy milk/)).toBeInTheDocument();
      expect(screen.getByText(/Walk dog/)).toBeInTheDocument();
    });
  });

  it('shows empty message when no todos', async () => {
    renderWithProviders(<TodosPage />);

    await waitFor(() => {
      expect(screen.getByText('No todos yet.')).toBeInTheDocument();
    });
  });

  it('shows add form only for logged-in users', async () => {
    renderWithProviders(<TodosPage />);
    expect(screen.queryByPlaceholderText('Add a new todo...')).not.toBeInTheDocument();

    get.mockResolvedValue({ data: { todos: [] } });
    renderWithProviders(<TodosPage />, { user: createMockUser() });
    expect(screen.getByPlaceholderText('Add a new todo...')).toBeInTheDocument();
  });

  it('adds a todo and refetches', async () => {
    post.mockResolvedValue({ res: { ok: true }, data: {} });
    get.mockResolvedValue({ data: { todos: [] } });
    renderWithProviders(<TodosPage />, { user: createMockUser() });

    await userEvent.type(screen.getByPlaceholderText('Add a new todo...'), 'New task');
    await userEvent.click(screen.getByText('Add'));

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith('/api/todos', { title: 'New task' });
    });
    expect(get).toHaveBeenCalledWith('/api/todos');
  });

  it('toggles a todo', async () => {
    patch.mockResolvedValue({});
    get.mockResolvedValue({
      data: { todos: [createMockTodo({ id: 3, title: 'Test todo' })] },
    });
    renderWithProviders(<TodosPage />, { user: createMockUser() });

    await waitFor(() => expect(screen.getByText('Done')).toBeInTheDocument());
    await userEvent.click(screen.getByText('Done'));

    await waitFor(() => {
      expect(patch).toHaveBeenCalledWith('/api/todos/3/toggle');
    });
  });

  it('deletes a todo', async () => {
    del.mockResolvedValue({});
    get.mockResolvedValue({
      data: { todos: [createMockTodo({ id: 4, title: 'Delete me' })] },
    });
    renderWithProviders(<TodosPage />, { user: createMockUser() });

    await waitFor(() => expect(screen.getByText('Delete')).toBeInTheDocument());
    await userEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(del).toHaveBeenCalledWith('/api/todos/4');
    });
  });
});
