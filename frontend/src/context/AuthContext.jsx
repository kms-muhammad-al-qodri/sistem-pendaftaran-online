import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api/client';
import { AuthContext } from './authContextInstance';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function initAuth() {
      try {
        const res = await apiFetch('/auth/me');
        if (!ignore) setUser(res.data);
      } catch {
        if (!ignore) setUser(null);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    initAuth();
    return () => {
      ignore = true;
    };
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
    } catch {
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
        isAdmin,
        isParticipant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { useAuth } from './useAuth';
export default AuthProvider;

