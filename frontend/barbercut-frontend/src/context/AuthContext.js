import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_BASE } from '../lib/api';

const AuthContext = createContext(null);

const USERS_KEY = 'bc_users';
const CURRENT_KEY = 'bc_current_user';

async function hashPassword(password) {
  const enc = new TextEncoder();
  const data = enc.encode(password);
  const buf = await window.crypto.subtle.digest('SHA-256', data);
  const arr = Array.from(new Uint8Array(buf));
  return arr.map(b => b.toString(16).padStart(2, '0')).join('');
}

function loadUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch { return []; }
}
function saveUsers(users) { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CURRENT_KEY));
      return saved || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === CURRENT_KEY) {
        try {
          setUser(e.newValue ? JSON.parse(e.newValue) : null);
        } catch {
          setUser(null);
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const signUp = async ({ email, username, password, role = 'CLIENT', barberId = null }) => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password, role, barberId })
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || 'Failed to register');
    }
    const profile = await res.json();
    localStorage.setItem(CURRENT_KEY, JSON.stringify(profile));
    setUser(profile);
    return profile;
  };

  const signIn = async ({ username, password, role }) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role })
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || 'Invalid username or password');
    }
    const profile = await res.json();
    localStorage.setItem(CURRENT_KEY, JSON.stringify(profile));
    setUser(profile);
    return profile;
  };

  const signOut = () => {
    localStorage.removeItem(CURRENT_KEY);
    setUser(null);
  };

  const value = { user, signUp, signIn, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
