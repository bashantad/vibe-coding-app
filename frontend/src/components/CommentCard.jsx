import { useState } from 'react';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import ReplyForm from './ReplyForm';

export function buildCommentTree(comments) {
  const map = {};
  const roots = [];
  comments.forEach((c) => {
    map[c.id] = { ...c, replies: [] };
  });
  comments.forEach((c) => {
    if (c.parent_id && map[c.parent_id]) {
      map[c.parent_id].replies.push(map[c.id]);
    } else {
      roots.push(map[c.id]);
    }
  });
  return roots;
}

export default function CommentCard({ comment, depth, user, articleId, onDelete, onRefresh }) {
  const [replying, setReplying] = useState(false);

  return (
    <div className={depth > 0 ? 'comment-thread' : 'mb-2'}>
      <Card className={`comment-card ${depth > 0 ? 'reply' : ''}`}>
        <Card.Body style={{ padding: '0.875rem 1rem' }}>
          <div className="d-flex justify-content-between align-items-start">
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="mb-1">
                <strong style={{ fontSize: '0.875rem', color: 'var(--gray-900)' }}>
                  {comment.author}
                </strong>
                {depth > 0 && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginLeft: '0.35rem' }}>
                    replied
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--gray-700)', lineHeight: 1.5 }}>
                {comment.description}
              </p>
            </div>
            <div className="d-flex gap-1 ms-2 flex-shrink-0">
              {user && (
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => setReplying(!replying)}
                >
                  Reply
                </Button>
              )}
              {user && (user.id === comment.user_id || !comment.user_id) && (
                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={() => onDelete(comment.id)}
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
          {replying && (
            <ReplyForm
              articleId={articleId}
              parentId={comment.id}
              onCancel={() => setReplying(false)}
              onSuccess={() => { setReplying(false); onRefresh(); }}
            />
          )}
        </Card.Body>
      </Card>
      {comment.replies.map((reply) => (
        <CommentCard
          key={reply.id}
          comment={reply}
          depth={depth + 1}
          user={user}
          articleId={articleId}
          onDelete={onDelete}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}
