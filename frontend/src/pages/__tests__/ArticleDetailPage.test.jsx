import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ArticleDetailPage from '../ArticleDetailPage';
import { renderWithProviders, createMockUser, createMockArticle, createMockComment } from '../../test/helpers';
import { get, post, del } from '../../api';

vi.mock('../../api');

describe('ArticleDetailPage', () => {
  const article = createMockArticle({
    id: 1,
    title: 'My Article',
    description: 'Article body text',
    author: 'alice',
    tags: ['react'],
    comments: [
      createMockComment({ id: 1, description: 'Great post!', author: 'bob', user_id: 2 }),
    ],
  });

  beforeEach(() => {
    get.mockResolvedValue({ res: { ok: true }, data: { article } });
  });

  it('shows spinner then renders article after fetch', async () => {
    renderWithProviders(<ArticleDetailPage />, {
      route: '/articles/1',
      routePath: '/articles/:id',
    });

    await waitFor(() => {
      expect(screen.getByText('My Article')).toBeInTheDocument();
      expect(screen.getByText('Article body text')).toBeInTheDocument();
      expect(screen.getByText(/alice/)).toBeInTheDocument();
    });
  });

  it('displays tags as badges', async () => {
    renderWithProviders(<ArticleDetailPage />, {
      route: '/articles/1',
      routePath: '/articles/:id',
    });

    await waitFor(() => {
      expect(screen.getByText('react')).toBeInTheDocument();
    });
  });

  it('displays comment tree', async () => {
    renderWithProviders(<ArticleDetailPage />, {
      route: '/articles/1',
      routePath: '/articles/:id',
    });

    await waitFor(() => {
      expect(screen.getByText(/Great post!/)).toBeInTheDocument();
    });
  });

  it('shows add comment form for logged-in users', async () => {
    renderWithProviders(<ArticleDetailPage />, {
      route: '/articles/1',
      routePath: '/articles/:id',
      user: createMockUser(),
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Add Comment')).toBeInTheDocument();
    });
  });

  it('submits a new comment', async () => {
    post.mockResolvedValue({ res: { ok: true }, data: {} });
    renderWithProviders(<ArticleDetailPage />, {
      route: '/articles/1',
      routePath: '/articles/:id',
      user: createMockUser(),
    });

    await waitFor(() => expect(screen.getByLabelText('Add Comment')).toBeInTheDocument());
    await userEvent.type(screen.getByLabelText('Add Comment'), 'Nice article');
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith('/api/articles/1/comments', {
        description: 'Nice article',
      });
    });
  });

  it('deletes a comment', async () => {
    del.mockResolvedValue({});
    renderWithProviders(<ArticleDetailPage />, {
      route: '/articles/1',
      routePath: '/articles/:id',
      user: createMockUser({ id: 2 }),
    });

    await waitFor(() => expect(screen.getByText('Delete')).toBeInTheDocument());
    await userEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(del).toHaveBeenCalledWith('/api/articles/1/comments/1');
    });
  });
});
