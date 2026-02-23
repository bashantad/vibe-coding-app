import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommentCard, { buildCommentTree } from '../CommentCard';
import { renderWithProviders, createMockUser, createMockComment } from '../../test/helpers';

vi.mock('../../api');

describe('buildCommentTree', () => {
  it('returns empty array for empty input', () => {
    expect(buildCommentTree([])).toEqual([]);
  });

  it('returns flat comments as roots', () => {
    const comments = [
      createMockComment({ id: 1, parent_id: null }),
      createMockComment({ id: 2, parent_id: null }),
    ];
    const tree = buildCommentTree(comments);
    expect(tree).toHaveLength(2);
    expect(tree[0].replies).toEqual([]);
    expect(tree[1].replies).toEqual([]);
  });

  it('nests child comments under parents', () => {
    const comments = [
      createMockComment({ id: 1, parent_id: null }),
      createMockComment({ id: 2, parent_id: 1 }),
      createMockComment({ id: 3, parent_id: 1 }),
    ];
    const tree = buildCommentTree(comments);
    expect(tree).toHaveLength(1);
    expect(tree[0].replies).toHaveLength(2);
  });

  it('handles deeply nested comments', () => {
    const comments = [
      createMockComment({ id: 1, parent_id: null }),
      createMockComment({ id: 2, parent_id: 1 }),
      createMockComment({ id: 3, parent_id: 2 }),
    ];
    const tree = buildCommentTree(comments);
    expect(tree).toHaveLength(1);
    expect(tree[0].replies[0].replies).toHaveLength(1);
    expect(tree[0].replies[0].replies[0].id).toBe(3);
  });

  it('treats orphan comments as roots', () => {
    const comments = [
      createMockComment({ id: 5, parent_id: 999 }),
    ];
    const tree = buildCommentTree(comments);
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe(5);
  });
});

describe('CommentCard', () => {
  const baseComment = { ...createMockComment(), replies: [] };
  const defaultProps = {
    comment: baseComment,
    depth: 0,
    user: null,
    articleId: '1',
    onDelete: vi.fn(),
    onRefresh: vi.fn(),
  };

  it('displays author and description', () => {
    renderWithProviders(<CommentCard {...defaultProps} />);
    expect(screen.getByText(/testuser/)).toBeInTheDocument();
    expect(screen.getByText(/Test comment/)).toBeInTheDocument();
  });

  it('shows "replied" label when depth > 0', () => {
    renderWithProviders(<CommentCard {...defaultProps} depth={1} />);
    expect(screen.getByText('replied')).toBeInTheDocument();
  });

  it('does not show "replied" label at depth 0', () => {
    renderWithProviders(<CommentCard {...defaultProps} depth={0} />);
    expect(screen.queryByText('replied')).not.toBeInTheDocument();
  });

  it('shows Reply and Delete buttons when user is logged in and owns comment', () => {
    renderWithProviders(
      <CommentCard {...defaultProps} user={createMockUser()} />
    );
    expect(screen.getByText('Reply')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('does not show Reply or Delete when not logged in', () => {
    renderWithProviders(<CommentCard {...defaultProps} user={null} />);
    expect(screen.queryByText('Reply')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('toggles ReplyForm when Reply button is clicked', async () => {
    renderWithProviders(
      <CommentCard {...defaultProps} user={createMockUser()} />
    );
    await userEvent.click(screen.getByText('Reply'));
    expect(screen.getByText('Submit')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Reply'));
    expect(screen.queryByText('Submit')).not.toBeInTheDocument();
  });

  it('calls onDelete when Delete is clicked', async () => {
    const onDelete = vi.fn();
    renderWithProviders(
      <CommentCard {...defaultProps} user={createMockUser()} onDelete={onDelete} />
    );
    await userEvent.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledWith(baseComment.id);
  });

  it('renders nested replies recursively', () => {
    const nestedComment = {
      ...createMockComment({ id: 1 }),
      replies: [
        {
          ...createMockComment({ id: 2, description: 'Nested reply' }),
          replies: [],
        },
      ],
    };
    renderWithProviders(<CommentCard {...defaultProps} comment={nestedComment} />);
    expect(screen.getByText(/Test comment/)).toBeInTheDocument();
    expect(screen.getByText(/Nested reply/)).toBeInTheDocument();
  });
});
