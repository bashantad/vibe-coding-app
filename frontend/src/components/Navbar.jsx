import { Link, useLocation } from 'react-router-dom';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Container from 'react-bootstrap/Container';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { to: '/', label: 'Todos' },
  { to: '/articles', label: 'Articles' },
  { to: '/feeds', label: 'Feeds' },
  { to: '/bookmarks', label: 'Bookmarks' },
  { to: '/shortener', label: 'Shortener' },
];

export default function AppNavbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  async function handleLogout(e) {
    e.preventDefault();
    await logout();
  }

  function isActive(to) {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  }

  return (
    <Navbar expand="md" className="app-navbar">
      <Container>
        <Navbar.Brand as={Link} to="/">Workspace</Navbar.Brand>
        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav">
          <Nav className="me-auto">
            {NAV_LINKS.map(({ to, label }) => (
              <Nav.Link
                key={to}
                as={Link}
                to={to}
                className={isActive(to) ? 'active' : ''}
              >
                {label}
              </Nav.Link>
            ))}
          </Nav>
          <Nav>
            {user ? (
              <>
                <Nav.Link as={Link} to="/profile" className="nav-user-btn">
                  {user.username}
                </Nav.Link>
                <Nav.Link href="#" onClick={handleLogout}>
                  Logout
                </Nav.Link>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                <Nav.Link as={Link} to="/signup" className="nav-user-btn">
                  Sign Up
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
