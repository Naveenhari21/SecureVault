import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Files, Activity, HardDrive, TrendingUp,
  ArrowRight, Shield, UserCheck, UserX, AlertTriangle
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
};

const ACTION_INFO = {
  LOGIN: { color: '#4f8ef7', bg: 'rgba(79,142,247,0.12)' },
  FILE_UPLOAD: { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  FILE_DOWNLOAD: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  FILE_DELETE: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  FILE_SHARE: { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
  PERMISSION_CHANGE: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  VERSION_UPLOAD: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then(({ data }) => setStats(data.stats))
      .catch(() => toast.error('Failed to load admin stats'))
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { label: 'Total Users',     value: stats.totalUsers,       icon: Users,     color: 'blue',   sub: `${stats.newUsersThisWeek} this week`,        link: '/admin/users' },
    { label: 'Active Users',    value: stats.activeUsers,      icon: UserCheck, color: 'green',  sub: `${stats.totalUsers - stats.activeUsers} inactive`, link: '/admin/users' },
    { label: 'Total Files',     value: stats.totalFiles,       icon: Files,     color: 'purple', sub: `${stats.deletedFiles} deleted`,              link: '/admin/files' },
    { label: 'Storage Used',    value: formatBytes(stats.totalStorage), icon: HardDrive, color: 'amber', sub: 'Encrypted on disk', link: '/admin/files' },
    { label: 'Total Events',    value: stats.totalLogs,        icon: Activity,  color: 'cyan',   sub: 'Audit log entries',                         link: '/admin/logs' },
  ] : [];

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Admin Panel" />
        <div className="page-content">

          {/* Admin badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', marginBottom: 24,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 999, color: '#ef4444', fontSize: '0.82rem', fontWeight: 600
          }}>
            <Shield size={14} /> Admin Control Panel
          </div>

          {loading ? (
            <div className="spinner-container"><div className="spinner" /></div>
          ) : (
            <>
              {/* Stat Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
                {statCards.map(({ label, value, icon: Icon, color, sub, link }) => (
                  <div
                    key={label}
                    className={`stat-card ${color}`}
                    onClick={() => navigate(link)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={`stat-icon ${color}`}><Icon size={20} /></div>
                    <div className="stat-value" style={{ fontSize: '1.6rem' }}>{value}</div>
                    <div className="stat-label">{label}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {/* Top Uploaders */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title"><TrendingUp size={16} style={{ marginRight: 8, color: 'var(--accent-blue)' }} />Top Uploaders</h3>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/users')}>
                      View All <ArrowRight size={13} />
                    </button>
                  </div>
                  {stats?.topUploaders?.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No uploads yet.</p>
                  ) : (
                    stats?.topUploaders?.map((u, i) => (
                      <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                          background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontWeight: 700, fontSize: '0.75rem'
                        }}>
                          {i + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{u.username}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                        <span className="badge badge-blue">{u.count} files</span>
                      </div>
                    ))
                  )}
                </div>

                {/* Action Breakdown */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title"><Activity size={16} style={{ marginRight: 8, color: 'var(--accent-green)' }} />Activity Breakdown</h3>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/logs')}>
                      Full Logs <ArrowRight size={13} />
                    </button>
                  </div>
                  {stats?.actionBreakdown?.map((a) => {
                    const info = ACTION_INFO[a._id] || { color: '#8892b0', bg: 'rgba(136,146,176,0.12)' };
                    const pct = stats.totalLogs ? Math.round((a.count / stats.totalLogs) * 100) : 0;
                    return (
                      <div key={a._id} style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: info.color }}>{a._id}</span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{a.count} ({pct}%)</span>
                        </div>
                        <div style={{ height: 4, background: 'var(--border)', borderRadius: 2 }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: info.color, borderRadius: 2, transition: 'width 0.4s' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Nav */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 24 }}>
                {[
                  { label: 'Manage Users', icon: Users, link: '/admin/users', desc: 'View, activate, deactivate and delete user accounts', color: 'var(--accent-blue)' },
                  { label: 'Manage Files', icon: Files, link: '/admin/files', desc: 'View all uploaded files including deleted ones', color: 'var(--accent-purple)' },
                  { label: 'System Logs',  icon: Activity, link: '/admin/logs', desc: 'Full system-wide activity audit trail', color: 'var(--accent-green)' },
                ].map(({ label, icon: Icon, link, desc, color }) => (
                  <div
                    key={label}
                    className="card"
                    onClick={() => navigate(link)}
                    style={{ cursor: 'pointer', textAlign: 'center', padding: 28 }}
                  >
                    <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color }}>
                      <Icon size={22} />
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{label}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{desc}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
