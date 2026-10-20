import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Files, Share2, Upload, Activity, Clock, ArrowRight } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import { formatDistanceToNow } from 'date-fns';
import { getFileInfo } from '../components/FileCard';

const ACTION_LABELS = {
  LOGIN: { label: 'Login', color: 'badge-blue' },
  LOGOUT: { label: 'Logout', color: 'badge-gray' },
  REGISTER: { label: 'Register', color: 'badge-green' },
  FILE_UPLOAD: { label: 'Upload', color: 'badge-green' },
  FILE_DOWNLOAD: { label: 'Download', color: 'badge-purple' },
  FILE_UPDATE: { label: 'Update', color: 'badge-amber' },
  FILE_DELETE: { label: 'Delete', color: 'badge-red' },
  FILE_SHARE: { label: 'Share', color: 'badge-cyan' },
  PERMISSION_CHANGE: { label: 'Perm. Change', color: 'badge-amber' },
  PERMISSION_REVOKE: { label: 'Perm. Revoke', color: 'badge-red' },
  VERSION_UPLOAD: { label: 'New Version', color: 'badge-purple' },
  VERSION_DOWNLOAD: { label: 'Ver. Download', color: 'badge-blue' },
  PROFILE_UPDATE: { label: 'Profile', color: 'badge-gray' },
  PASSWORD_CHANGE: { label: 'Pwd Changed', color: 'badge-amber' },
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ myFiles: 0, sharedWithMe: 0, recentDocuments: [] });
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, logsRes] = await Promise.all([
          api.get('/files/dashboard/stats'),
          api.get('/logs?limit=8'),
        ]);
        setStats(statsRes.data.stats);
        setRecentLogs(logsRes.data.logs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statCards = [
    { label: 'My Files', value: stats.myFiles, icon: Files, color: 'blue', onClick: () => navigate('/my-files') },
    { label: 'Shared With Me', value: stats.sharedWithMe, icon: Share2, color: 'purple', onClick: () => navigate('/shared') },
    { label: 'Recent Activity', value: recentLogs.length, icon: Activity, color: 'green', onClick: () => navigate('/activity') },
    { label: 'Upload File', value: '+', icon: Upload, color: 'amber', onClick: () => navigate('/upload') },
  ];

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Dashboard" />
        <div className="page-content">
          {loading ? (
            <div className="spinner-container"><div className="spinner" /></div>
          ) : (
            <>
              {/* Stats */}
              <div className="stats-grid">
                {statCards.map(({ label, value, icon: Icon, color, onClick }) => (
                  <div key={label} className={`stat-card ${color}`} onClick={onClick} style={{ cursor: 'pointer' }}>
                    <div className={`stat-icon ${color}`}><Icon size={22} /></div>
                    <div className="stat-value">{value}</div>
                    <div className="stat-label">{label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {/* Recent Documents */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Recent Documents</h3>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate('/my-files')}>
                      View All <ArrowRight size={14} />
                    </button>
                  </div>
                  {stats.recentDocuments.length === 0 ? (
                    <div className="empty-state" style={{ padding: '30px 0' }}>
                      <div className="empty-icon"><Files size={24} /></div>
                      <p className="empty-title">No files yet</p>
                      <button className="btn btn-primary btn-sm" onClick={() => navigate('/upload')}>Upload your first file</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {stats.recentDocuments.map((file) => {
                        const { icon } = getFileInfo(file.mimeType);
                        return (
                          <div
                            key={file._id}
                            onClick={() => navigate(`/files/${file._id}`)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 12,
                              padding: '10px 12px', borderRadius: 'var(--radius-md)',
                              background: 'var(--bg-card-hover)', cursor: 'pointer',
                              transition: 'background 0.2s',
                            }}
                          >
                            <span style={{ fontSize: '1.3rem' }}>{icon}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {file.originalName}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                v{file.currentVersion} · {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Recent Activity */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Recent Activity</h3>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate('/activity')}>
                      View All <ArrowRight size={14} />
                    </button>
                  </div>
                  {recentLogs.length === 0 ? (
                    <div className="empty-state" style={{ padding: '30px 0' }}>
                      <div className="empty-icon"><Activity size={24} /></div>
                      <p className="empty-title">No activity yet</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {recentLogs.map((log) => {
                        const { label, color } = ACTION_LABELS[log.action] || { label: log.action, color: 'badge-gray' };
                        return (
                          <div key={log._id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                            <span className={`badge ${color}`} style={{ flexShrink: 0, marginTop: 2 }}>{label}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {log.details || log.action}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Clock size={10} />
                                {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
