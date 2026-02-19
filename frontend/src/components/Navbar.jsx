import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  async function handleLogout(e) {
    e.preventDefault();
    await logout();
  }

  return (
    <nav className="navbar navbar-expand navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand" to="/">Todo App</Link>
        <ul className="navbar-nav me-auto">
          <li className="nav-item">
            <Link className="nav-link" to="/">Todos</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/articles">Articles</Link>
          </li>
        </ul>
        <ul className="navbar-nav">
          {user ? (
            <>
              <li className="nav-item">
                <Link className="nav-link" to="/profile">{user.username}</Link>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#" onClick={handleLogout}>Logout</a>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link className="nav-link" to="/login">Login</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/signup">Sign Up</Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}
