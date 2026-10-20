import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Trash2, Search, UserCheck, Users, X, CheckCircle
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import toast from 'react-hot-toast';

const PERMISSION_OPTIONS = ['view', 'edit'];

/* ── tiny helpers ──────────────────────────────────────────────────────────── */
const initials = (u) => {
  const first = u.firstName?.[0] || '';
  const last  = u.lastName?.[0]  || '';
  return (first + last).toUpperCase() || u.username?.[0]?.toUpperCase() || '?';
};

const displayName = (u) => {
  const full = [u.firstName, u.lastName].filter(Boolean).join(' ');
  return full || u.username;
};

/* ── component ─────────────────────────────────────────────────────────────── */
const ManagePermissions = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  /* page state */
  const [file, setFile]             = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  /* all-users state */
  const [allUsers, setAllUsers]       = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError]   = useState(false);

  /* picker state */
  const [searchQ, setSearchQ]         = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPerm, setNewPerm]         = useState('view');
  const [granting, setGranting]       = useState(false);

  /* per-row saving */
  const [savingId, setSavingId]       = useState(null);

  /* ── load file + current permissions ─────────────────────────────────────── */
  useEffect(() => {
    const load = async () => {
      try {
        const [fRes, pRes] = await Promise.all([
          api.get(`/files/${id}`),
          api.get(`/permissions/${id}`),
        ]);
        setFile(fRes.data.file);
        setPermissions(pRes.data.permissions);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Access denied');
        navigate(-1);
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  /* ── load all registered users once ──────────────────────────────────────── */
  useEffect(() => {
    const fetchUsers = async () => {
      setUsersLoading(true);
      setUsersError(false);
      try {
        const { data } = await api.get('/auth/users');
        setAllUsers(data.users);
      } catch {
        setUsersError(true);
        toast.error('Could not load user list');
      } finally {
        setUsersLoading(false);
      }
    };
    fetchUsers();
  }, []);

  /* ── derive eligible users (exclude already-have-access) ─────────────────── */
  const alreadyHasAccess = useMemo(
    () => new Set(permissions.map((p) => p.user?._id?.toString())),
    [permissions]
  );

  const eligibleUsers = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    return allUsers.filter((u) => {
      if (alreadyHasAccess.has(u._id.toString())) return false;
      if (!q) return true;
      return (
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.firstName?.toLowerCase().includes(q) ||
        u.lastName?.toLowerCase().includes(q)
      );
    });
  }, [allUsers, alreadyHasAccess, searchQ]);

  /* ── refresh permissions after grant ─────────────────────────────────────── */
  const refreshPermissions = async () => {
    const { data } = await api.get(`/permissions/${id}`);
    setPermissions(data.permissions);
  };

  /* ── grant ────────────────────────────────────────────────────────────────── */
  const handleGrant = async () => {
    if (!selectedUser) { toast.error('Please select a user first'); return; }
    setGranting(true);
    try {
      await api.post(`/permissions/${id}`, { userId: selectedUser._id, permission: newPerm });
      await refreshPermissions();
      toast.success(`${newPerm} access granted to ${selectedUser.username}`);
      setSelectedUser(null);
      setSearchQ('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to grant access');
    } finally {
      setGranting(false);
    }
  };

  /* ── change existing permission ───────────────────────────────────────────── */
  const handleChange = async (userId, permission) => {
    setSavingId(userId);
    try {
      await api.post(`/permissions/${id}`, { userId, permission });
      setPermissions((prev) =>
        prev.map((p) => (p.user._id === userId ? { ...p, permission } : p))
      );
      toast.success('Permission updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSavingId(null);
    }
  };

  /* ── revoke ───────────────────────────────────────────────────────────────── */
  const handleRevoke = async (userId, username) => {
    if (!window.confirm(`Revoke all access for ${username}?`)) return;
    try {
      await api.delete(`/permissions/${id}/${userId}`);
      setPermissions((prev) => prev.filter((p) => p.user._id !== userId));
      toast.success('Access revoked');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to revoke');
    }
  };

  /* ── render ───────────────────────────────────────────────────────────────── */
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Manage Permissions" />
        <div className="page-content">

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate(-1)}
            style={{ marginBottom: 20 }}
          >
            <ChevronLeft size={16} /> Back
          </button>

          <div className="page-header">
            <div>
              <h1 className="page-title">Manage Access</h1>
              <p className="page-subtitle">{file?.originalName}</p>
            </div>
          </div>

          {pageLoading ? (
            <div className="spinner-container" style={{ padding: 60 }}>
              <div className="spinner" />
            </div>
          ) : (
            <div style={{ maxWidth: 720 }}>

              {/* ── Share With User ───────────────────────────────────────── */}
              <div className="card" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <Users size={18} style={{ color: 'var(--accent-blue)' }} />
                  <h3 className="card-title" style={{ margin: 0 }}>Share With User</h3>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 16 }}>
                  Select a registered user below, choose a permission level, then click <strong>Grant Access</strong>.
                </p>

                {/* Search input */}
                <div className="search-input-wrapper" style={{ marginBottom: 12 }}>
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Filter by name, username, or email…"
                    value={searchQ}
                    onChange={(e) => {
                      setSearchQ(e.target.value);
                      setSelectedUser(null);
                    }}
                  />
                  {searchQ && (
                    <button
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                      onClick={() => { setSearchQ(''); setSelectedUser(null); }}
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                {/* User list */}
                {usersLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                    Loading registered users…
                  </div>
                ) : usersError ? (
                  <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', color: 'var(--accent-red)', fontSize: '0.84rem' }}>
                    Could not load users. Make sure the backend is running and try refreshing.
                  </div>
                ) : eligibleUsers.length === 0 ? (
                  <div style={{ padding: '12px 16px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 'var(--radius-md)', color: 'var(--accent-amber)', fontSize: '0.84rem' }}>
                    {searchQ
                      ? `No users match "${searchQ}". Try a different search.`
                      : 'All registered users already have access to this file, or no other users exist yet.'}
                  </div>
                ) : (
                  <div style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    maxHeight: 260,
                    overflowY: 'auto',
                  }}>
                    {eligibleUsers.map((u, idx) => {
                      const isSelected = selectedUser?._id === u._id;
                      return (
                        <div
                          key={u._id}
                          onClick={() => setSelectedUser(isSelected ? null : u)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '10px 14px',
                            gap: 12,
                            cursor: 'pointer',
                            borderBottom: idx < eligibleUsers.length - 1 ? '1px solid var(--border)' : 'none',
                            background: isSelected
                              ? 'rgba(79,142,247,0.1)'
                              : 'transparent',
                            borderLeft: isSelected
                              ? '3px solid var(--accent-blue)'
                              : '3px solid transparent',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          {/* Avatar */}
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                            background: isSelected
                              ? 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))'
                              : 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontWeight: 700, fontSize: '0.82rem',
                          }}>
                            {initials(u)}
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {displayName(u)}
                              {u.firstName && (
                                <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6, fontSize: '0.8rem' }}>
                                  @{u.username}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {u.email}
                            </div>
                          </div>

                          {/* Selected indicator */}
                          {isSelected && (
                            <CheckCircle size={18} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Grant controls — shown once a user is selected */}
                {selectedUser && (
                  <div style={{
                    marginTop: 14,
                    padding: '14px 16px',
                    background: 'rgba(79,142,247,0.07)',
                    border: '1px solid rgba(79,142,247,0.2)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}>
                    {/* Mini user card */}
                    <div style={{ flex: 1, minWidth: 150 }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 2 }}>Granting access to:</div>
                      <div style={{ fontWeight: 700, color: 'var(--accent-blue)', fontSize: '0.9rem' }}>
                        {displayName(selectedUser)}
                        <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6, fontSize: '0.8rem' }}>
                          ({selectedUser.email})
                        </span>
                      </div>
                    </div>

                    {/* Permission selector */}
                    <select
                      className="filter-select"
                      value={newPerm}
                      onChange={(e) => setNewPerm(e.target.value)}
                      style={{ minWidth: 90 }}
                    >
                      {PERMISSION_OPTIONS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>

                    {/* Grant button */}
                    <button
                      className="btn btn-primary"
                      onClick={handleGrant}
                      disabled={granting}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      <UserCheck size={15} />
                      {granting ? 'Granting…' : `Grant ${newPerm} access`}
                    </button>

                    {/* Cancel */}
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => { setSelectedUser(null); }}
                      title="Cancel selection"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* ── Current Access ────────────────────────────────────────── */}
              <div className="card">
                <h3 className="card-title" style={{ marginBottom: 16 }}>
                  Current Access ({permissions.length})
                </h3>

                {permissions.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    No users have been granted access yet.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {permissions.map((p) => (
                      <div key={p._id} className="perm-row">
                        {/* Avatar */}
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0,
                        }}>
                          {p.user?.username?.[0]?.toUpperCase() || '?'}
                        </div>

                        {/* User info */}
                        <div className="perm-user-info">
                          <div className="perm-user-name">{p.user?.username || 'Unknown'}</div>
                          <div className="perm-user-email">{p.user?.email}</div>
                        </div>

                        {/* Owner badge OR permission controls */}
                        {p.permission === 'owner' ? (
                          <span className="badge badge-purple">Owner</span>
                        ) : (
                          <>
                            <select
                              id={`perm-select-${p.user?._id}`}
                              className="perm-select"
                              value={p.permission}
                              onChange={(e) => handleChange(p.user._id, e.target.value)}
                              disabled={savingId === p.user._id}
                            >
                              {['view', 'edit', 'none'].map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                            <button
                              id={`revoke-${p.user?._id}`}
                              className="btn btn-danger btn-sm"
                              onClick={() => handleRevoke(p.user._id, p.user.username)}
                              title="Revoke access"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagePermissions;
