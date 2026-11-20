import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axiosInstance';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // resolves hydration from localStorage

  // ── Rehydrate session on first load ───────────────────────────────────────
  useEffect(() => {
    const token    = localStorage.getItem('expense_token');
    const stored   = localStorage.getItem('expense_user');
    if (token && stored) {
      try { setUser(JSON.parse(stored)); } catch { clearSession(); }
    }
    setLoading(false);
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const saveSession = (token, userData) => {
    localStorage.setItem('expense_token', token);
    localStorage.setItem('expense_user',  JSON.stringify(userData));
    setUser(userData);
  };

  const clearSession = () => {
    localStorage.removeItem('expense_token');
    localStorage.removeItem('expense_user');
    setUser(null);
  };

  // ── Auth actions ───────────────────────────────────────────────────────────
  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    saveSession(data.token, data.user);
    return data;
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    saveSession(data.token, data.user);
    return data;
  };

  const logout = () => clearSession();

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
