import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ShortenerPage from '../ShortenerPage';
import { renderWithProviders, createMockUser, createMockShortUrl } from '../../test/helpers';
import { get, post, del } from '../../api';

vi.mock('../../api');

describe('ShortenerPage', () => {
  beforeEach(() => {
    get.mockResolvedValue({ res: { ok: true }, data: { short_urls: [] } });
  });

  it('shows login prompt when not authenticated', () => {
    renderWithProviders(<ShortenerPage />);
    expect(screen.getByText(/please log in/i)).toBeInTheDocument();
  });

  it('displays list of short URLs', async () => {
    get.mockResolvedValue({
      res: { ok: true },
      data: {
        short_urls: [
          createMockShortUrl({ id: 1, original_url: 'https://example.com', short_url: '/s/abc123', click_count: 5 }),
          createMockShortUrl({ id: 2, original_url: 'https://react.dev', short_url: '/s/def456', click_count: 0 }),
        ],
      },
    });
    renderWithProviders(<ShortenerPage />, { user: createMockUser() });

    await waitFor(() => {
      expect(screen.getByText('https://example.com')).toBeInTheDocument();
      expect(screen.getByText('https://react.dev')).toBeInTheDocument();
      expect(screen.getByText(/5 clicks/)).toBeInTheDocument();
    });
  });

  it('shows empty state message', async () => {
    renderWithProviders(<ShortenerPage />, { user: createMockUser() });

    await waitFor(() => {
      expect(screen.getByText('No short URLs yet.')).toBeInTheDocument();
    });
  });

  it('creates a short URL via form', async () => {
    post.mockResolvedValue({ res: { ok: true }, data: {} });
    renderWithProviders(<ShortenerPage />, { user: createMockUser() });

    await waitFor(() => expect(screen.getByPlaceholderText('Enter URL to shorten')).toBeInTheDocument());

    await userEvent.type(screen.getByPlaceholderText('Enter URL to shorten'), 'https://example.com');
    await userEvent.click(screen.getByText('Shorten'));

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith('/api/shortener', {
        original_url: 'https://example.com',
      });
    });
  });

  it('deletes a short URL', async () => {
    del.mockResolvedValue({});
    get.mockResolvedValue({
      res: { ok: true },
      data: { short_urls: [createMockShortUrl({ id: 5, original_url: 'https://delete-me.com' })] },
    });
    renderWithProviders(<ShortenerPage />, { user: createMockUser() });

    await waitFor(() => expect(screen.getByText('https://delete-me.com')).toBeInTheDocument());
    await userEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(del).toHaveBeenCalledWith('/api/shortener/5');
    });
  });

  it('shows error alert on fetch failure', async () => {
    get.mockResolvedValue({
      res: { ok: false },
      data: { error: 'Server error' },
    });
    renderWithProviders(<ShortenerPage />, { user: createMockUser() });

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });
});
