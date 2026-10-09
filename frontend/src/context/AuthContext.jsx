import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user profile on initial app mount
  const checkAuth = async () => {
    try {
      const res = await apiFetch('/auth/me');
      setUser(res.data);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    setUser(res.data);
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await apiFetch('/auth/register', {
      method: 'POST',
      body: { name, email, password },
    });
    setUser(res.data);
    return res.data;
  };

  const logout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (err) {
      // Ignore logout errors
    } finally {
      setUser(null);
    }
  };

  const isAdmin = user?.role === 'admin';
  const isParticipant = user?.role === 'participant';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        checkAuth,
        isAdmin,
        isParticipant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
