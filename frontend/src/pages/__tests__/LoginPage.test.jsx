import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import LoginPage from '../LoginPage';
import { renderWithProviders, LocationDisplay } from '../../test/helpers';

describe('LoginPage', () => {
  it('renders the login form', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByText('Login', { selector: 'h2' })).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('shows link to signup page', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByText('Sign Up')).toHaveAttribute('href', '/signup');
  });

  it('navigates to / on successful login', async () => {
    const login = vi.fn().mockResolvedValue({ ok: true });
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<LocationDisplay />} />
      </Routes>,
      {
        route: '/login',
        authOverrides: { login },
      }
    );

    await userEvent.type(screen.getByLabelText('Username'), 'alice');
    await userEvent.type(screen.getByLabelText('Password'), 'pass123');
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('alice', 'pass123');
      expect(screen.getByTestId('location')).toHaveTextContent('/');
    });
  });

  it('shows error on failed login', async () => {
    const login = vi.fn().mockResolvedValue({ ok: false, error: 'Invalid credentials' });
    renderWithProviders(<LoginPage />, { authOverrides: { login } });

    await userEvent.type(screen.getByLabelText('Username'), 'alice');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});
