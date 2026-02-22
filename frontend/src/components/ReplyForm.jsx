import { useState } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { post } from '../api';
import FlashMessage from './FlashMessage';

export default function ReplyForm({ articleId, parentId, onCancel, onSuccess }) {
  const [replyText, setReplyText] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const { res, data } = await post(`/api/articles/${articleId}/comments`, {
      description: replyText,
      parent_id: parentId,
    });
    if (res.ok) {
      setReplyText('');
      onSuccess();
    } else {
      setError(data.error);
    }
  }

  return (
    <Form onSubmit={handleSubmit} className="mt-2 reply">
      <FlashMessage message={error} onDismiss={() => setError('')} />
      <Form.Control
        as="textarea"
        rows={2}
        value={replyText}
        onChange={(e) => setReplyText(e.target.value)}
        required
        className="mb-2"
      />
      <Button type="submit" size="sm" variant="primary" className="me-1">
        Submit
      </Button>
      <Button
        size="sm"
        variant="outline-secondary"
        onClick={onCancel}
      >
        Cancel
      </Button>
    </Form>
  );
}
