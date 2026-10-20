import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Download, Trash2, Share2, Clock, User, Tag, Shield, History,
  ChevronLeft, FileText, Upload, Lock
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { getFileInfo, formatSize } from '../components/FileCard';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const FileDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [myPermission, setMyPermission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newVersionFile, setNewVersionFile] = useState(null);
  const [versionComment, setVersionComment] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/files/${id}`);
        setFile(data.file);
        setMyPermission(data.myPermission);
      } catch (err) {
        toast.error('File not found or access denied');
        navigate('/my-files');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleDownload = async () => {
    try {
      const res = await api.get(`/files/${id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch { toast.error('Download failed'); }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${file.originalName}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/files/${id}`);
      toast.success('File deleted');
      navigate('/my-files');
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const handleUploadVersion = async (e) => {
    e.preventDefault();
    if (!newVersionFile) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', newVersionFile);
    fd.append('comment', versionComment);
    try {
      const { data } = await api.put(`/files/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFile(data.file);
      setNewVersionFile(null);
      setVersionComment('');
      toast.success(`Version ${data.file.currentVersion} uploaded!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar title="File Details" />
        <div className="spinner-container"><div className="spinner" /></div>
      </div>
    </div>
  );

  if (!file) return null;

  const { icon, color } = getFileInfo(file.mimeType);
  const isOwner = myPermission === 'owner';
  const canEdit = myPermission === 'owner' || myPermission === 'edit';

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar title="File Details" />
        <div className="page-content">
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>
            <ChevronLeft size={16} /> Back
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
            {/* Main */}
            <div>
              <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
                  <div style={{ width: 64, height: 64, background: color, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', flexShrink: 0 }}>
                    {icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, wordBreak: 'break-all' }}>
                      {file.originalName}
                    </h2>
                    {file.description && (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 8 }}>{file.description}</p>
                    )}
                    {file.tags?.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {file.tags.map((t) => (
                          <span key={t} className="badge badge-blue">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <span className={`badge ${myPermission === 'owner' ? 'badge-purple' : myPermission === 'edit' ? 'badge-green' : 'badge-blue'}`}>
                      <Lock size={10} /> {myPermission}
                    </span>
                  </div>
                </div>

                {/* Metadata grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                  {[
                    { icon: FileText, label: 'File Name', value: file.originalName },
                    { icon: Shield, label: 'Type', value: file.mimeType },
                    { icon: Clock, label: 'Size', value: formatSize(file.size) },
                    { icon: History, label: 'Version', value: `v${file.currentVersion}` },
                    { icon: User, label: 'Owner', value: file.owner?.username },
                    { icon: Clock, label: 'Uploaded', value: format(new Date(file.createdAt), 'MMM d, yyyy HH:mm') },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <Icon size={15} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                        <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 500, wordBreak: 'break-all' }}>{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upload New Version */}
              {canEdit && (
                <div className="card">
                  <h3 className="card-title" style={{ marginBottom: 16 }}>Upload New Version</h3>
                  <form onSubmit={handleUploadVersion}>
                    <div className="form-group">
                      <label className="form-label">New File</label>
                      <input
                        type="file"
                        id="new-version-file"
                        className="form-input"
                        onChange={(e) => setNewVersionFile(e.target.files[0])}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Version Note</label>
                      <input
                        id="version-comment"
                        type="text"
                        className="form-input"
                        placeholder="What changed in this version?"
                        value={versionComment}
                        onChange={(e) => setVersionComment(e.target.value)}
                      />
                    </div>
                    <button type="submit" id="upload-version-btn" className="btn btn-primary" disabled={!newVersionFile || uploading}>
                      <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload Version'}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Sidebar Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card">
                <h4 className="card-title" style={{ marginBottom: 14 }}>Actions</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button id="download-btn" className="btn btn-primary btn-full" onClick={handleDownload}>
                    <Download size={16} /> Download File
                  </button>
                  <Link to={`/files/${id}/versions`} className="btn btn-secondary btn-full" style={{ justifyContent: 'center' }}>
                    <History size={16} /> Version History
                  </Link>
                  {isOwner && (
                    <Link to={`/files/${id}/permissions`} className="btn btn-secondary btn-full" style={{ justifyContent: 'center' }}>
                      <Share2 size={16} /> Manage Access
                    </Link>
                  )}
                  {isOwner && (
                    <button id="delete-btn" className="btn btn-danger btn-full" onClick={handleDelete}>
                      <Trash2 size={16} /> Delete File
                    </button>
                  )}
                </div>
              </div>

              <div className="card" style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Shield size={16} style={{ color: 'var(--accent-green)' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Encrypted</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  This file is stored with AES-256-CBC encryption. It is decrypted only during authorized downloads.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileDetails;
