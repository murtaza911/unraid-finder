import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client.js';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/login', { username, password });
      localStorage.setItem('token', res.data.token);
      navigate('/');
    } catch { setError('Invalid username or password'); }
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
      <form onSubmit={handleSubmit} style={{ width: 320, padding: 32, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}>
        <h1 style={{ fontSize: 20, marginBottom: 24, textAlign: 'center' }}>Unraid Finder</h1>
        {error && <div style={{ color: 'var(--danger)', marginBottom: 12, fontSize: 12, textAlign: 'center' }}>{error}</div>}
        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: '100%', padding: '8px 12px', marginBottom: 12, background: 'var(--bg-input)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-sm)', outline: 'none' }} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '8px 12px', marginBottom: 16, background: 'var(--bg-input)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-sm)', outline: 'none' }} />
        <button type="submit" style={{ width: '100%', padding: '8px 12px', background: 'var(--accent)', color: 'white', borderRadius: 'var(--radius-sm)', fontWeight: 500 }}>Sign In</button>
      </form>
    </div>
  );
}
