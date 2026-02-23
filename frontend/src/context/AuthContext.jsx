import { createContext, useContext, useState, useEffect } from 'react';
import { get, post } from '../api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);

  async function refreshUser() {
    const { data } = await get('/api/me');
    setUser(data.user);
  }

  useEffect(() => {
    refreshUser();
  }, []);

  async function loginFn(username, password) {
    const { res, data } = await post('/api/login', { username, password });
    if (res.ok) {
      setUser(data.user);
      return { ok: true };
    }
    return { ok: false, error: data.error };
  }

  async function signupFn(username, password) {
    const { res, data } = await post('/api/signup', { username, password });
    if (res.ok) {
      setUser(data.user);
      return { ok: true };
    }
    return { ok: false, error: data.error };
  }

  async function logoutFn() {
    await post('/api/logout');
    setUser(null);
  }

  if (user === undefined) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, login: loginFn, signup: signupFn, logout: logoutFn, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
