import { useState, useEffect, useCallback } from 'react';
import { Activity, Clock, Filter } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const ACTION_INFO = {
  LOGIN:             { label: 'Login',           color: '#4f8ef7', bg: 'rgba(79,142,247,0.12)' },
  LOGOUT:            { label: 'Logout',          color: '#8892b0', bg: 'rgba(136,146,176,0.12)' },
  REGISTER:          { label: 'Register',        color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  FILE_UPLOAD:       { label: 'Upload',          color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  FILE_DOWNLOAD:     { label: 'Download',        color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  FILE_UPDATE:       { label: 'Update',          color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  FILE_DELETE:       { label: 'Delete',          color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  FILE_SHARE:        { label: 'Share',           color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
  PERMISSION_CHANGE: { label: 'Perm. Change',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  PERMISSION_REVOKE: { label: 'Perm. Revoke',   color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  VERSION_UPLOAD:    { label: 'New Version',    color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  VERSION_DOWNLOAD:  { label: 'Ver. Download',  color: '#4f8ef7', bg: 'rgba(79,142,247,0.12)' },
  PROFILE_UPDATE:    { label: 'Profile',        color: '#8892b0', bg: 'rgba(136,146,176,0.12)' },
  PASSWORD_CHANGE:   { label: 'Pwd Change',     color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
};

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 25 };
      if (action) params.action = action;
      const { data } = await api.get('/logs', { params });
      setLogs(data.logs);
      setTotal(data.total);
      setPages(data.pages);
    } catch { toast.error('Failed to load logs'); }
    finally { setLoading(false); }
  }, [page, action]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Activity Logs" />
        <div className="page-content">
          <div className="page-header">
            <div>
              <h1 className="page-title">Activity Logs</h1>
              <p className="page-subtitle">{total} total events recorded</p>
            </div>
          </div>

          {/* Filter */}
          <div className="search-bar" style={{ marginBottom: 20 }}>
            <Filter size={16} style={{ color: 'var(--text-muted)', alignSelf: 'center' }} />
            <select
              id="action-filter"
              className="filter-select"
              value={action}
              onChange={(e) => { setAction(e.target.value); setPage(1); }}
            >
              <option value="">All Actions</option>
              {Object.entries(ACTION_INFO).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="spinner-container"><div className="spinner" /></div>
          ) : logs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Activity size={28} /></div>
              <h3 className="empty-title">No activity found</h3>
              <p className="empty-subtitle">Your actions will appear here</p>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>File</th>
                      <th>Details</th>
                      <th>Date & Time</th>
                      <th>IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => {
                      const info = ACTION_INFO[log.action] || { label: log.action, color: '#8892b0', bg: 'rgba(136,146,176,0.12)' };
                      return (
                        <tr key={log._id}>
                          <td>
                            <span
                              className="log-action-badge"
                              style={{ background: info.bg, color: info.color }}
                            >
                              {info.label}
                            </span>
                          </td>
                          <td>
                            {log.file ? (
                              <span style={{ fontSize: '0.85rem', color: 'var(--accent-blue)' }}>
                                {log.file.originalName || 'File'}
                              </span>
                            ) : '—'}
                          </td>
                          <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {log.details || '—'}
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <Clock size={12} style={{ color: 'var(--text-muted)' }} />
                              {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm')}
                            </div>
                          </td>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                            {log.ipAddress || '—'}
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
                    <button
                      key={p}
                      className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
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

export default ActivityLogs;
