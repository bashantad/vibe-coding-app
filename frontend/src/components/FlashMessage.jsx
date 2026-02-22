import Alert from 'react-bootstrap/Alert';

export default function FlashMessage({ message, variant = 'danger', onDismiss }) {
  if (!message) return null;
  return (
    <Alert variant={variant} dismissible onClose={onDismiss}>
      {message}
    </Alert>
  );
}
