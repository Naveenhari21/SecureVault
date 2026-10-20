import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Download, Clock, User } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';

const VersionHistory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [versions, setVersions] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [vRes, fRes] = await Promise.all([
          api.get(`/versions/${id}`),
          api.get(`/files/${id}`),
        ]);
        setVersions(vRes.data.versions);
        setFile(fRes.data.file);
      } catch {
        toast.error('Failed to load version history');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleDownload = async (version) => {
    try {
      const res = await api.get(`/versions/${id}/${version._id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `v${version.versionNumber}_${version.originalName}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Downloading v${version.versionNumber}`);
    } catch { toast.error('Download failed'); }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Version History" />
        <div className="page-content">
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>
            <ChevronLeft size={16} /> Back
          </button>

          <div className="page-header">
            <div>
              <h1 className="page-title">Version History</h1>
              <p className="page-subtitle">{file?.originalName} · {versions.length} version{versions.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {loading ? (
            <div className="spinner-container"><div className="spinner" /></div>
          ) : (
            <div className="card">
              <div className="version-timeline">
                {versions.map((v, idx) => {
                  const isCurrent = v.versionNumber === file?.currentVersion;
                  return (
                    <div key={v._id} className="version-item">
                      <div className={`version-dot ${isCurrent ? 'current' : ''}`}>
                        v{v.versionNumber}
                      </div>
                      <div className="version-content">
                        <div className="version-meta">
                          <span className="version-number">Version {v.versionNumber}</span>
                          {isCurrent && <span className="badge badge-green">Current</span>}
                          <span className="version-date">
                            <Clock size={11} style={{ display: 'inline', marginRight: 3 }} />
                            {format(new Date(v.createdAt), 'MMM d, yyyy HH:mm')}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                          <span className="version-author">
                            <User size={11} style={{ display: 'inline', marginRight: 3 }} />
                            {v.uploadedBy?.username || 'Unknown'}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {(v.size / 1024).toFixed(1)} KB
                          </span>
                          {v.comment && <span className="version-comment">"{v.comment}"</span>}
                        </div>
                        <div style={{ marginTop: 10 }}>
                          <button
                            id={`download-v${v.versionNumber}`}
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleDownload(v)}
                          >
                            <Download size={14} /> Download v{v.versionNumber}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VersionHistory;
