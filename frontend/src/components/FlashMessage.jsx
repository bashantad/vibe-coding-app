export default function FlashMessage({ message, variant = 'danger', onDismiss }) {
  if (!message) return null;
  return (
    <div className={`alert alert-${variant} alert-dismissible fade show`} role="alert">
      {message}
      {onDismiss && (
        <button type="button" className="btn-close" onClick={onDismiss}></button>
      )}
    </div>
  );
}
