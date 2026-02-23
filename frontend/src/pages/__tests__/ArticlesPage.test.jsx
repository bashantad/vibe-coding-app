import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ArticlesPage from '../ArticlesPage';
import { renderWithProviders, createMockUser, createMockArticle } from '../../test/helpers';
import { get, del } from '../../api';

vi.mock('../../api');

describe('ArticlesPage', () => {
  beforeEach(() => {
    get.mockResolvedValue({ data: { articles: [] } });
  });

  it('fetches and displays articles', async () => {
    get.mockResolvedValue({
      data: {
        articles: [
          createMockArticle({ id: 1, title: 'React Tips', tags: ['react'] }),
          createMockArticle({ id: 2, title: 'Testing Guide', tags: ['testing', 'vitest'] }),
        ],
      },
    });
    renderWithProviders(<ArticlesPage />);

    await waitFor(() => {
      expect(screen.getByText('React Tips')).toBeInTheDocument();
      expect(screen.getByText('Testing Guide')).toBeInTheDocument();
    });
  });

  it('displays tags as badges', async () => {
    get.mockResolvedValue({
      data: {
        articles: [createMockArticle({ id: 1, tags: ['react', 'hooks'] })],
      },
    });
    renderWithProviders(<ArticlesPage />);

    await waitFor(() => {
      expect(screen.getByText('react')).toBeInTheDocument();
      expect(screen.getByText('hooks')).toBeInTheDocument();
    });
  });

  it('shows New Article button for logged-in users', async () => {
    renderWithProviders(<ArticlesPage />, { user: createMockUser() });
    expect(screen.getByText('+ New Article')).toBeInTheDocument();
  });

  it('hides New Article button when logged out', async () => {
    renderWithProviders(<ArticlesPage />);
    expect(screen.queryByText('+ New Article')).not.toBeInTheDocument();
  });

  it('shows Edit/Delete for owned articles', async () => {
    const user = createMockUser({ id: 5 });
    get.mockResolvedValue({
      data: {
        articles: [createMockArticle({ id: 1, user_id: 5 })],
      },
    });
    renderWithProviders(<ArticlesPage />, { user });

    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
  });

  it('deletes an article and refetches', async () => {
    del.mockResolvedValue({});
    const user = createMockUser({ id: 5 });
    get.mockResolvedValue({
      data: {
        articles: [createMockArticle({ id: 10, user_id: 5 })],
      },
    });
    renderWithProviders(<ArticlesPage />, { user });

    await waitFor(() => expect(screen.getByText('Delete')).toBeInTheDocument());
    await userEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(del).toHaveBeenCalledWith('/api/articles/10');
    });
  });
});
