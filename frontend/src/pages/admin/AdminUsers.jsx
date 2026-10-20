import { useState, useEffect, useCallback } from 'react';
import { Search, UserCheck, UserX, Trash2, Shield, ShieldOff, Filter } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/admin/users', { params });
      setUsers(data.users);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleStatus = async (userId, currentStatus, username) => {
    if (!window.confirm(`${currentStatus ? 'Deactivate' : 'Activate'} user "${username}"?`)) return;
    setActionLoading(userId + '_status');
    try {
      const { data } = await api.put(`/admin/users/${userId}/toggle-status`);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: data.user.isActive } : u));
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setActionLoading(null);
    }
  };

  const changeRole = async (userId, newRole, username) => {
    if (!window.confirm(`Change "${username}"'s role to ${newRole}?`)) return;
    setActionLoading(userId + '_role');
    try {
      const { data } = await api.put(`/admin/users/${userId}/role`, { role: newRole });
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: data.user.role } : u));
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async (userId, username) => {
    if (!window.confirm(`PERMANENTLY delete user "${username}" and all their files? This cannot be undone!`)) return;
    setActionLoading(userId + '_delete');
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(prev => prev.filter(u => u._id !== userId));
      setTotal(t => t - 1);
      toast.success(`User ${username} deleted`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setActionLoading(null);
    }
  };

  const initials = (u) => ((u.firstName?.[0] || '') + (u.lastName?.[0] || '') || u.username?.[0] || '?').toUpperCase();

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Admin — Users" />
        <div className="page-content">
          <div className="page-header">
            <div>
              <h1 className="page-title">User Management</h1>
              <p className="page-subtitle">{total} total registered users</p>
            </div>
          </div>

          {/* Filters */}
          <div className="search-bar" style={{ marginBottom: 20 }}>
            <div className="search-input-wrapper" style={{ flex: 1 }}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Search by username or email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <select className="filter-select" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
            <select className="filter-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {loading ? (
            <div className="spinner-container"><div className="spinner" /></div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Search size={28} /></div>
              <h3 className="empty-title">No users found</h3>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Files</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const isSelf = u._id === currentUser?._id;
                      return (
                        <tr key={u._id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                                background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontWeight: 700, fontSize: '0.78rem'
                              }}>
                                {initials(u)}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                                  {u.username}
                                  {isSelf && <span style={{ marginLeft: 6, fontSize: '0.7rem', color: 'var(--accent-blue)' }}>(you)</span>}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  {u.firstName} {u.lastName}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontSize: '0.85rem' }}>{u.email}</td>
                          <td>
                            <span className={`badge ${u.role === 'admin' ? 'badge-red' : 'badge-gray'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>
                              {u.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.fileCount}</td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            {format(new Date(u.createdAt), 'MMM d, yyyy')}
                          </td>
                          <td>
                            {!isSelf && (
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap' }}>
                                {/* Toggle Status */}
                                <button
                                  className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`}
                                  title={u.isActive ? 'Deactivate' : 'Activate'}
                                  onClick={() => toggleStatus(u._id, u.isActive, u.username)}
                                  disabled={actionLoading === u._id + '_status'}
                                >
                                  {u.isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                                </button>
                                {/* Toggle Role */}
                                <button
                                  className="btn btn-secondary btn-sm"
                                  title={u.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                                  onClick={() => changeRole(u._id, u.role === 'admin' ? 'user' : 'admin', u.username)}
                                  disabled={actionLoading === u._id + '_role'}
                                >
                                  {u.role === 'admin' ? <ShieldOff size={13} /> : <Shield size={13} />}
                                </button>
                                {/* Delete */}
                                <button
                                  className="btn btn-danger btn-sm"
                                  title="Delete User"
                                  onClick={() => deleteUser(u._id, u.username)}
                                  disabled={actionLoading === u._id + '_delete'}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                  {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                    <button key={p} className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPage(p)}>{p}</button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
