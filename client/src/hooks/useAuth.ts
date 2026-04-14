import { useState, useEffect, useCallback } from 'react';
import api from '../api/client.js';
import type { User } from '../types/index.js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    api.get<User>('/auth/me').then((res) => setUser(res.data)).catch(() => { localStorage.removeItem('token'); setUser(null); }).finally(() => setLoading(false));
  }, []);
  const logout = useCallback(() => { localStorage.removeItem('token'); setUser(null); window.location.href = '/login'; }, []);
  return { user, loading, logout };
}
