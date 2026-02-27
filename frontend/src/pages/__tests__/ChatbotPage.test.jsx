import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import ChatbotPage from '../ChatbotPage';
import { renderWithProviders, createMockUser, createMockChatMessage, LocationDisplay } from '../../test/helpers';
import { get, post, del } from '../../api';

vi.mock('../../api');

describe('ChatbotPage', () => {
  it('redirects to /login when not authenticated', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/chatbot" element={<ChatbotPage />} />
        <Route path="/login" element={<LocationDisplay />} />
      </Routes>,
      { route: '/chatbot' }
    );

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/login');
    });
  });

  it('shows empty state message', async () => {
    get.mockResolvedValue({
      res: { ok: true },
      data: { messages: [] },
    });

    renderWithProviders(<ChatbotPage />, { user: createMockUser() });

    await waitFor(() => {
      expect(screen.getByText('Ask me anything about presentation skills!')).toBeInTheDocument();
    });
  });

  it('displays fetched messages', async () => {
    get.mockResolvedValue({
      res: { ok: true },
      data: {
        messages: [
          createMockChatMessage({ id: 1, role: 'user', content: 'How do I start?' }),
          createMockChatMessage({ id: 2, role: 'assistant', content: 'Start with a hook!' }),
        ],
      },
    });

    renderWithProviders(<ChatbotPage />, { user: createMockUser() });

    await waitFor(() => {
      expect(screen.getByText('How do I start?')).toBeInTheDocument();
      expect(screen.getByText('Start with a hook!')).toBeInTheDocument();
    });
  });

  it('sends message and shows response', async () => {
    get.mockResolvedValue({
      res: { ok: true },
      data: { messages: [] },
    });
    post.mockResolvedValue({
      res: { ok: true },
      data: {
        messages: [
          createMockChatMessage({ id: 1, role: 'user', content: 'Tips for eye contact?' }),
          createMockChatMessage({ id: 2, role: 'assistant', content: 'Look at foreheads!' }),
        ],
      },
    });

    renderWithProviders(<ChatbotPage />, { user: createMockUser() });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    });

    await userEvent.type(screen.getByPlaceholderText('Type your message...'), 'Tips for eye contact?');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith('/api/chat/messages', { content: 'Tips for eye contact?' });
      expect(screen.getByText('Look at foreheads!')).toBeInTheDocument();
    });
  });

  it('clears chat history', async () => {
    get.mockResolvedValue({
      res: { ok: true },
      data: {
        messages: [
          createMockChatMessage({ id: 1, role: 'user', content: 'Hello' }),
        ],
      },
    });
    del.mockResolvedValue({ res: { ok: true }, data: { message: 'Cleared' } });

    renderWithProviders(<ChatbotPage />, { user: createMockUser() });

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: 'Clear History' }));

    await waitFor(() => {
      expect(del).toHaveBeenCalledWith('/api/chat/messages');
      expect(screen.queryByText('Hello')).not.toBeInTheDocument();
    });
  });
});
