import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FlashMessage from '../FlashMessage';

describe('FlashMessage', () => {
  it('renders nothing when message is empty', () => {
    const { container } = render(<FlashMessage message="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when message is null', () => {
    const { container } = render(<FlashMessage message={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders an alert with the message text', () => {
    render(<FlashMessage message="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('calls onDismiss when close button is clicked', async () => {
    const onDismiss = vi.fn();
    render(<FlashMessage message="Error" onDismiss={onDismiss} />);
    await userEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
