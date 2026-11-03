import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    if (!api.getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const u = await api.getMe();
      setUser(u);
    } catch (err) {
      console.warn('Auth check failed:', err.message);
      api.setToken('');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
    const handleExpired = () => setUser(null);
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    const profile = await api.getMe();
    setUser(profile);
    return profile;
  };

  const register = async (name, email, password, role = 'analyst') => {
    await api.register(name, email, password, role);
    return await login(email, password);
  };

  const logout = () => {
    api.setToken('');
    setUser(null);
  };

  const quickDemoLogin = async (role = 'admin') => {
    if (role === 'admin') {
      try {
        return await login('admin@sentinmail.org', 'AdminPassword123!');
      } catch (err) {
        throw err;
      }
    } else {
      try {
        return await login('analyst@sentinmail.org', 'AnalystPassword123!');
      } catch {
        try {
          await api.register('Lead Analyst', 'analyst@sentinmail.org', 'AnalystPassword123!');
          return await login('analyst@sentinmail.org', 'AnalystPassword123!');
        } catch {
          return await login('admin@sentinmail.org', 'AdminPassword123!');
        }
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, quickDemoLogin, refreshUser: checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
