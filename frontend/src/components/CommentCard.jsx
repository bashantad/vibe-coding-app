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
    <div
      className="mb-2"
      style={depth > 0 ? {
        marginLeft: depth * 32,
        borderLeft: '3px solid #6c757d',
        paddingLeft: 12,
      } : undefined}
    >
      <Card className={depth > 0 ? 'border-0 bg-light' : ''}>
        <Card.Body>
          <div className="d-flex justify-content-between">
            <div>
              <strong>{comment.author}</strong>
              {depth > 0 && <span className="text-muted ms-1" style={{ fontSize: '0.85em' }}>replied</span>}
              : {comment.description}
            </div>
            <div className="text-nowrap ms-2">
              {user && (
                <Button
                  size="sm"
                  variant="outline-secondary"
                  className="me-1"
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
