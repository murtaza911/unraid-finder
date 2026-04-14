import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme.js';
import { useAuth } from '../hooks/useAuth.js';
import api from '../api/client.js';
import type { User, BrowsePath } from '../types/index.js';
import '../styles/settings.css';

interface SearchStats {
  totalFiles: number;
  lastScan: string | null;
}

interface NewUserForm {
  username: string;
  password: string;
  role: 'admin' | 'full' | 'readonly';
}

export function SettingsPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  // User management state
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [newUser, setNewUser] = useState<NewUserForm>({ username: '', password: '', role: 'readonly' });
  const [addingUser, setAddingUser] = useState(false);
  const [userError, setUserError] = useState('');

  // Browse paths state
  const [paths, setPaths] = useState<BrowsePath[]>([]);
  const [pathsLoading, setPathsLoading] = useState(false);
  const [pathsSaving, setPathsSaving] = useState(false);

  // Search index state
  const [searchStats, setSearchStats] = useState<SearchStats | null>(null);
  const [reindexing, setReindexing] = useState(false);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;
    // Load users
    setUsersLoading(true);
    api.get<User[]>('/users')
      .then((res) => setUsers(res.data))
      .catch(() => {})
      .finally(() => setUsersLoading(false));

    // Load browse paths
    setPathsLoading(true);
    api.get<BrowsePath[]>('/settings/paths')
      .then((res) => setPaths(res.data))
      .catch(() => {})
      .finally(() => setPathsLoading(false));

    // Load search stats
    api.get<SearchStats>('/search/stats')
      .then((res) => setSearchStats(res.data))
      .catch(() => {});
  }, [isAdmin]);

  const handleDeleteUser = async (userId: number) => {
    try {
      await api.delete(`/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch {
      // ignore
    }
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password) return;
    setAddingUser(true);
    setUserError('');
    try {
      const res = await api.post<User>('/users', newUser);
      setUsers((prev) => [...prev, res.data]);
      setNewUser({ username: '', password: '', role: 'readonly' });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setUserError(axiosErr?.response?.data?.message ?? 'Failed to add user');
    } finally {
      setAddingUser(false);
    }
  };

  const handlePathVisibleToggle = (mountPath: string) => {
    setPaths((prev) =>
      prev.map((p) => (p.mountPath === mountPath ? { ...p, visible: !p.visible } : p))
    );
  };

  const handleSavePaths = async () => {
    setPathsSaving(true);
    try {
      await api.put('/settings/paths', paths);
    } catch {
      // ignore
    } finally {
      setPathsSaving(false);
    }
  };

  const handleReindex = async () => {
    setReindexing(true);
    try {
      await api.post('/search/reindex');
      // Refresh stats after reindex
      const res = await api.get<SearchStats>('/search/stats');
      setSearchStats(res.data);
    } catch {
      // ignore
    } finally {
      setReindexing(false);
    }
  };

  const formatLastScan = (lastScan: string | null) => {
    if (!lastScan) return 'Never';
    const date = new Date(lastScan);
    return date.toLocaleString();
  };

  return (
    <div className="settings" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="settings__header">
        <span className="settings__title">Settings</span>
        <button className="settings__back" onClick={() => navigate('/')}>← Back to Files</button>
      </div>

      {/* Appearance */}
      <div className="settings__section">
        <div className="settings__section-title">Appearance</div>
        <div className="settings__row">
          <div>
            <div className="settings__label">Dark Mode</div>
            <div className="settings__sublabel">Switch between light and dark theme</div>
          </div>
          <button
            className={`settings__toggle${theme === 'dark' ? ' settings__toggle--on' : ''}`}
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
          />
        </div>
      </div>

      {/* User Management — admin only */}
      {isAdmin && (
        <div className="settings__section">
          <div className="settings__section-title">User Management</div>
          {usersLoading ? (
            <div className="settings__sublabel">Loading users…</div>
          ) : (
            <>
              {users.map((u) => (
                <div key={u.id} className="settings__user-row">
                  <span className="settings__user-name">{u.username}</span>
                  <span className="settings__user-role">{u.role}</span>
                  {u.id !== user?.id && (
                    <button
                      className="settings__btn settings__btn--danger"
                      onClick={() => handleDeleteUser(u.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </>
          )}

          {/* Add user form */}
          <div className="settings__row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <input
              className="settings__input"
              placeholder="Username"
              value={newUser.username}
              onChange={(e) => setNewUser((prev) => ({ ...prev, username: e.target.value }))}
              style={{ flex: '1 1 100px', minWidth: 80 }}
            />
            <input
              className="settings__input"
              placeholder="Password"
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
              style={{ flex: '1 1 100px', minWidth: 80 }}
            />
            <select
              className="settings__input"
              value={newUser.role}
              onChange={(e) =>
                setNewUser((prev) => ({ ...prev, role: e.target.value as NewUserForm['role'] }))
              }
              style={{ width: 'auto' }}
            >
              <option value="readonly">Read Only</option>
              <option value="full">Full</option>
              <option value="admin">Admin</option>
            </select>
            <button
              className="settings__btn"
              onClick={handleAddUser}
              disabled={addingUser || !newUser.username || !newUser.password}
            >
              {addingUser ? 'Adding…' : 'Add'}
            </button>
          </div>
          {userError && (
            <div style={{ color: 'var(--danger)', fontSize: 11, marginTop: 4 }}>{userError}</div>
          )}
        </div>
      )}

      {/* Browse Paths — admin only */}
      {isAdmin && (
        <div className="settings__section">
          <div className="settings__section-title">Browse Paths</div>
          {pathsLoading ? (
            <div className="settings__sublabel">Loading paths…</div>
          ) : paths.length === 0 ? (
            <div className="settings__sublabel">No paths configured.</div>
          ) : (
            paths.map((p) => (
              <div key={p.mountPath} className="settings__row">
                <div>
                  <div className="settings__label">{p.displayName}</div>
                  <div className="settings__sublabel">{p.mountPath}</div>
                </div>
                <button
                  className={`settings__toggle${p.visible ? ' settings__toggle--on' : ''}`}
                  onClick={() => handlePathVisibleToggle(p.mountPath)}
                  aria-label={`Toggle visibility of ${p.displayName}`}
                />
              </div>
            ))
          )}
          {paths.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <button className="settings__btn" onClick={handleSavePaths} disabled={pathsSaving}>
                {pathsSaving ? 'Saving…' : 'Save Paths'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Search Index — admin only */}
      {isAdmin && (
        <div className="settings__section">
          <div className="settings__section-title">Search Index</div>
          <div className="settings__row">
            <div>
              <div className="settings__label">Total Files</div>
              <div className="settings__sublabel">
                {searchStats ? searchStats.totalFiles.toLocaleString() : '—'}
              </div>
            </div>
          </div>
          <div className="settings__row">
            <div>
              <div className="settings__label">Last Scan</div>
              <div className="settings__sublabel">
                {searchStats ? formatLastScan(searchStats.lastScan) : '—'}
              </div>
            </div>
            <button
              className="settings__btn"
              onClick={handleReindex}
              disabled={reindexing}
            >
              {reindexing ? 'Indexing…' : 'Re-index Now'}
            </button>
          </div>
        </div>
      )}

      {/* Sign Out */}
      <div className="settings__section">
        <div className="settings__section-title">Account</div>
        <div className="settings__row">
          <div>
            <div className="settings__label">Sign Out</div>
            <div className="settings__sublabel">
              Signed in as {user?.username ?? '…'} ({user?.role ?? '…'})
            </div>
          </div>
          <button className="settings__btn settings__btn--danger" onClick={logout}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
