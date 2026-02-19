import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, put } from '../api';
import { useAuth } from '../context/AuthContext';
import FlashMessage from '../components/FlashMessage';

export default function ProfilePage() {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    async function load() {
      const { res, data } = await get('/api/profile');
      if (res.ok) {
        setUsername(data.user.username);
        setFullName(data.user.full_name || '');
        setEmail(data.user.email || '');
      }
    }
    load();
  }, [user, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    const { res, data } = await put('/api/profile', {
      username,
      full_name: fullName,
      email,
    });
    if (res.ok) {
      setSuccess(data.message);
      refreshUser();
    } else {
      setError(data.error);
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <h2>Edit Profile</h2>
        <FlashMessage message={error} onDismiss={() => setError('')} />
        <FlashMessage message={success} variant="success" onDismiss={() => setSuccess('')} />
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Full Name</label>
            <input
              className="form-control"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">Save</button>
        </form>
      </div>
    </div>
  );
}
