import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FeedsPage from '../FeedsPage';
import { renderWithProviders, createMockFeedPost } from '../../test/helpers';
import { get } from '../../api';

vi.mock('../../api');

describe('FeedsPage', () => {
  it('shows loading spinner then posts', async () => {
    get.mockResolvedValue({
      res: { ok: true },
      data: {
        posts: [
          createMockFeedPost({ title: 'Leadership tips', subreddit: 'leadership', score: 99 }),
        ],
      },
    });

    renderWithProviders(<FeedsPage />);

    expect(screen.getByRole('status')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(screen.getByText('Leadership tips')).toBeInTheDocument();
    });
  });

  it('displays post title, subreddit, and score', async () => {
    get.mockResolvedValue({
      res: { ok: true },
      data: {
        posts: [
          createMockFeedPost({ title: 'ML Breakthrough', subreddit: 'MachineLearning', score: 250 }),
        ],
      },
    });

    renderWithProviders(<FeedsPage />);

    await waitFor(() => {
      expect(screen.getByText('ML Breakthrough')).toBeInTheDocument();
      // Subreddit appears in both filter pill and post card
      expect(screen.getAllByText('r/MachineLearning').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Score: 250')).toBeInTheDocument();
    });
  });

  it('handles fetch error', async () => {
    get.mockResolvedValue({
      res: { ok: false },
      data: { error: 'Failed to fetch feeds.' },
    });

    renderWithProviders(<FeedsPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch feeds.')).toBeInTheDocument();
    });
  });

  it('sort dropdown triggers refetch', async () => {
    get.mockResolvedValue({
      res: { ok: true },
      data: { posts: [createMockFeedPost()] },
    });

    renderWithProviders(<FeedsPage />);

    await waitFor(() => {
      expect(get).toHaveBeenCalledWith('/api/feeds?sort=hot');
    });

    await userEvent.selectOptions(screen.getByLabelText('Sort posts'), 'new');

    await waitFor(() => {
      expect(get).toHaveBeenCalledWith('/api/feeds?sort=new');
    });
  });
});
