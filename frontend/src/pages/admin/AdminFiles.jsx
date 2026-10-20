import { useState, useEffect, useCallback } from 'react';
import { Search, Trash2, Download, Eye } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { getFileInfo, formatSize } from '../../components/FileCard';

const AdminFiles = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [deleting, setDeleting] = useState(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      const { data } = await api.get('/admin/files', { params });
      setFiles(data.files);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const handleDownload = async (file) => {
    try {
      const res = await api.get(`/files/${file._id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Download failed (may be deleted)');
    }
  };

  const handleDelete = async (fileId, fileName) => {
    if (!window.confirm(`PERMANENTLY delete "${fileName}"? This removes the encrypted file from disk and ALL version history. This cannot be undone!`)) return;
    setDeleting(fileId);
    try {
      await api.delete(`/admin/files/${fileId}`);
      setFiles(prev => prev.filter(f => f._id !== fileId));
      setTotal(t => t - 1);
      toast.success('File permanently deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Admin — Files" />
        <div className="page-content">
          <div className="page-header">
            <div>
              <h1 className="page-title">All Files</h1>
              <p className="page-subtitle">{total} total files (including deleted)</p>
            </div>
          </div>

          <div className="search-bar" style={{ marginBottom: 20 }}>
            <div className="search-input-wrapper" style={{ flex: 1 }}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Search by file name..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>

          {loading ? (
            <div className="spinner-container"><div className="spinner" /></div>
          ) : files.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Search size={28} /></div>
              <h3 className="empty-title">No files found</h3>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>File</th>
                      <th>Owner</th>
                      <th>Size</th>
                      <th>Version</th>
                      <th>Status</th>
                      <th>Uploaded</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((file) => {
                      const { icon, color } = getFileInfo(file.mimeType);
                      return (
                        <tr key={file._id} style={{ opacity: file.isDeleted ? 0.5 : 1 }}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 34, height: 34, borderRadius: 8, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                                {icon}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {file.originalName}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{file.mimeType}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{file.owner?.username || 'N/A'}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{file.owner?.email}</div>
                          </td>
                          <td style={{ fontSize: '0.85rem' }}>{formatSize(file.size)}</td>
                          <td>
                            <span className="badge badge-blue">v{file.currentVersion}</span>
                          </td>
                          <td>
                            {file.isDeleted
                              ? <span className="badge badge-red">Deleted</span>
                              : <span className="badge badge-green">Active</span>}
                          </td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            {format(new Date(file.createdAt), 'MMM d, yyyy HH:mm')}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              {!file.isDeleted && (
                                <button className="btn btn-secondary btn-sm" title="Download" onClick={() => handleDownload(file)}>
                                  <Download size={13} />
                                </button>
                              )}
                              <button
                                className="btn btn-danger btn-sm"
                                title="Permanently Delete"
                                onClick={() => handleDelete(file._id, file.originalName)}
                                disabled={deleting === file._id}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
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

export default AdminFiles;
