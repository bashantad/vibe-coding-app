import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import ProfilePage from '../ProfilePage';
import { renderWithProviders, createMockUser, LocationDisplay } from '../../test/helpers';
import { get, put } from '../../api';

vi.mock('../../api');

describe('ProfilePage', () => {
  it('redirects to /login when not authenticated', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/login" element={<LocationDisplay />} />
      </Routes>,
      { route: '/profile' }
    );

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/login');
    });
  });

  it('fetches and pre-fills profile data', async () => {
    get.mockResolvedValue({
      res: { ok: true },
      data: { user: { username: 'alice', full_name: 'Alice Smith', email: 'alice@test.com' } },
    });
    renderWithProviders(<ProfilePage />, { user: createMockUser({ username: 'alice' }) });

    await waitFor(() => {
      expect(screen.getByDisplayValue('alice')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Alice Smith')).toBeInTheDocument();
      expect(screen.getByDisplayValue('alice@test.com')).toBeInTheDocument();
    });
  });

  it('submits profile update via PUT', async () => {
    get.mockResolvedValue({
      res: { ok: true },
      data: { user: { username: 'alice', full_name: '', email: '' } },
    });
    put.mockResolvedValue({ res: { ok: true }, data: { message: 'Profile updated' } });
    const refreshUser = vi.fn();

    renderWithProviders(<ProfilePage />, {
      user: createMockUser({ username: 'alice' }),
      authOverrides: { refreshUser },
    });

    await waitFor(() => expect(screen.getByDisplayValue('alice')).toBeInTheDocument());

    await userEvent.type(screen.getByLabelText('Full Name'), 'Alice Wonder');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(put).toHaveBeenCalledWith('/api/profile', expect.objectContaining({
        username: 'alice',
        full_name: 'Alice Wonder',
      }));
      expect(screen.getByText('Profile updated')).toBeInTheDocument();
      expect(refreshUser).toHaveBeenCalled();
    });
  });

  it('shows error on failed update', async () => {
    get.mockResolvedValue({
      res: { ok: true },
      data: { user: { username: 'alice', full_name: '', email: '' } },
    });
    put.mockResolvedValue({ res: { ok: false }, data: { error: 'Username taken' } });

    renderWithProviders(<ProfilePage />, {
      user: createMockUser({ username: 'alice' }),
    });

    await waitFor(() => expect(screen.getByDisplayValue('alice')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(screen.getByText('Username taken')).toBeInTheDocument();
    });
  });

  it('shows success message after save', async () => {
    get.mockResolvedValue({
      res: { ok: true },
      data: { user: { username: 'bob', full_name: 'Bob', email: 'bob@test.com' } },
    });
    put.mockResolvedValue({ res: { ok: true }, data: { message: 'Saved!' } });

    renderWithProviders(<ProfilePage />, {
      user: createMockUser({ username: 'bob' }),
    });

    await waitFor(() => expect(screen.getByDisplayValue('bob')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(screen.getByText('Saved!')).toBeInTheDocument();
    });
  });
});
