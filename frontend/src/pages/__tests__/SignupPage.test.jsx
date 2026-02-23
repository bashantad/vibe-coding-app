import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import SignupPage from '../SignupPage';
import { renderWithProviders, LocationDisplay } from '../../test/helpers';

describe('SignupPage', () => {
  it('renders the signup form', () => {
    renderWithProviders(<SignupPage />);
    expect(screen.getByText('Sign Up', { selector: 'h2' })).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
  });

  it('shows link to login page', () => {
    renderWithProviders(<SignupPage />);
    expect(screen.getByRole('link', { name: 'Login' })).toHaveAttribute('href', '/login');
  });

  it('navigates to / on successful signup', async () => {
    const signup = vi.fn().mockResolvedValue({ ok: true });
    renderWithProviders(
      <Routes>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/" element={<LocationDisplay />} />
      </Routes>,
      {
        route: '/signup',
        authOverrides: { signup },
      }
    );

    await userEvent.type(screen.getByLabelText('Username'), 'newuser');
    await userEvent.type(screen.getByLabelText('Password'), 'pass123');
    await userEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    await waitFor(() => {
      expect(signup).toHaveBeenCalledWith('newuser', 'pass123');
      expect(screen.getByTestId('location')).toHaveTextContent('/');
    });
  });

  it('shows error on failed signup', async () => {
    const signup = vi.fn().mockResolvedValue({ ok: false, error: 'Username taken' });
    renderWithProviders(<SignupPage />, { authOverrides: { signup } });

    await userEvent.type(screen.getByLabelText('Username'), 'existing');
    await userEvent.type(screen.getByLabelText('Password'), 'pass');
    await userEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    await waitFor(() => {
      expect(screen.getByText('Username taken')).toBeInTheDocument();
    });
  });
});
