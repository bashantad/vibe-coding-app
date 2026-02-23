import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReplyForm from '../ReplyForm';
import { renderWithProviders } from '../../test/helpers';
import { post } from '../../api';

vi.mock('../../api');

describe('ReplyForm', () => {
  const defaultProps = {
    articleId: '5',
    parentId: 10,
    onCancel: vi.fn(),
    onSuccess: vi.fn(),
  };

  it('renders textarea and buttons', () => {
    renderWithProviders(<ReplyForm {...defaultProps} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByText('Submit')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const onCancel = vi.fn();
    renderWithProviders(<ReplyForm {...defaultProps} onCancel={onCancel} />);
    await userEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('submits reply and calls onSuccess', async () => {
    post.mockResolvedValue({ res: { ok: true }, data: {} });
    const onSuccess = vi.fn();
    renderWithProviders(<ReplyForm {...defaultProps} onSuccess={onSuccess} />);

    await userEvent.type(screen.getByRole('textbox'), 'My reply');
    await userEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith('/api/articles/5/comments', {
        description: 'My reply',
        parent_id: 10,
      });
    });
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it('shows error on failed submit', async () => {
    post.mockResolvedValue({
      res: { ok: false },
      data: { error: 'Reply failed' },
    });
    renderWithProviders(<ReplyForm {...defaultProps} />);

    await userEvent.type(screen.getByRole('textbox'), 'Bad reply');
    await userEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(screen.getByText('Reply failed')).toBeInTheDocument();
    });
  });

  it('sends correct API payload with articleId and parentId', async () => {
    post.mockResolvedValue({ res: { ok: true }, data: {} });
    renderWithProviders(
      <ReplyForm articleId="99" parentId={42} onCancel={vi.fn()} onSuccess={vi.fn()} />
    );

    await userEvent.type(screen.getByRole('textbox'), 'test');
    await userEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith('/api/articles/99/comments', {
        description: 'test',
        parent_id: 42,
      });
    });
  });
});
