import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookmarksPage from '../BookmarksPage';
import { renderWithProviders, createMockUser, createMockBookmark } from '../../test/helpers';
import { get, post, del } from '../../api';

vi.mock('../../api');

describe('BookmarksPage', () => {
  beforeEach(() => {
    get.mockResolvedValue({ res: { ok: true }, data: { bookmarks: [] } });
  });

  it('shows login prompt when not authenticated', () => {
    renderWithProviders(<BookmarksPage />);
    expect(screen.getByText(/please log in/i)).toBeInTheDocument();
  });

  it('shows loading spinner then bookmarks', async () => {
    get.mockResolvedValue({
      res: { ok: true },
      data: {
        bookmarks: [
          createMockBookmark({ id: 1, title: 'React Docs', url: 'https://react.dev' }),
          createMockBookmark({ id: 2, title: 'MDN', url: 'https://developer.mozilla.org' }),
        ],
      },
    });
    renderWithProviders(<BookmarksPage />, { user: createMockUser() });

    await waitFor(() => {
      expect(screen.getByText('React Docs')).toBeInTheDocument();
      expect(screen.getByText('MDN')).toBeInTheDocument();
    });
  });

  it('shows empty message when no bookmarks', async () => {
    renderWithProviders(<BookmarksPage />, { user: createMockUser() });

    await waitFor(() => {
      expect(screen.getByText('No bookmarks yet.')).toBeInTheDocument();
    });
  });

  it('adds a bookmark and refetches', async () => {
    post.mockResolvedValue({ res: { ok: true }, data: {} });
    renderWithProviders(<BookmarksPage />, { user: createMockUser() });

    await waitFor(() => expect(screen.getByPlaceholderText('URL')).toBeInTheDocument());

    await userEvent.type(screen.getByPlaceholderText('URL'), 'https://example.com');
    await userEvent.type(screen.getByPlaceholderText('Title'), 'Example');
    await userEvent.click(screen.getByText('Save Bookmark'));

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith('/api/bookmarks', {
        url: 'https://example.com',
        title: 'Example',
        description: '',
      });
    });
  });

  it('deletes a bookmark', async () => {
    del.mockResolvedValue({});
    get.mockResolvedValue({
      res: { ok: true },
      data: { bookmarks: [createMockBookmark({ id: 5, title: 'Delete me' })] },
    });
    renderWithProviders(<BookmarksPage />, { user: createMockUser() });

    await waitFor(() => expect(screen.getByText('Delete me')).toBeInTheDocument());
    await userEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(del).toHaveBeenCalledWith('/api/bookmarks/5');
    });
  });

  it('shows error alert on fetch failure', async () => {
    get.mockResolvedValue({
      res: { ok: false },
      data: { error: 'Server error' },
    });
    renderWithProviders(<BookmarksPage />, { user: createMockUser() });

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });
});
