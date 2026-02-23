import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppNavbar from '../Navbar';
import { renderWithProviders, createMockUser } from '../../test/helpers';

describe('Navbar', () => {
  it('shows Login and Sign Up links when logged out', () => {
    renderWithProviders(<AppNavbar />);
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
  });

  it('shows username and Logout when logged in', () => {
    renderWithProviders(<AppNavbar />, { user: createMockUser() });
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
  });

  it('always shows Todos and Articles links', () => {
    renderWithProviders(<AppNavbar />);
    expect(screen.getByText('Todos')).toBeInTheDocument();
    expect(screen.getByText('Articles')).toBeInTheDocument();
  });

  it('shows brand link', () => {
    renderWithProviders(<AppNavbar />);
    expect(screen.getByText('Todo App')).toBeInTheDocument();
  });

  it('calls logout when Logout is clicked', async () => {
    const { authValue } = renderWithProviders(<AppNavbar />, {
      user: createMockUser(),
    });
    await userEvent.click(screen.getByText('Logout'));
    expect(authValue.logout).toHaveBeenCalledOnce();
  });
});
