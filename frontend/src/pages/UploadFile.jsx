import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import toast from 'react-hot-toast';

const MAX_SIZE_MB = 50;

const UploadFile = () => {
  const navigate = useNavigate();
  const fileInput = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const formatSize = (bytes) => {
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const validateFile = (file) => {
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File too large. Max size is ${MAX_SIZE_MB}MB`;
    }
    return null;
  };

  const selectFile = (file) => {
    const err = validateFile(file);
    if (err) { setError(err); return; }
    setError('');
    setSelectedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) selectFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) { toast.error('Please select a file'); return; }
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('description', description);
    formData.append('tags', tags);

    try {
      const { data } = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          setProgress(Math.round((e.loaded * 100) / e.total));
        },
      });
      toast.success('File uploaded and encrypted successfully!');
      navigate(`/files/${data.file._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Upload File" />
        <div className="page-content">
          <div className="page-header">
            <div>
              <h1 className="page-title">Upload File</h1>
              <p className="page-subtitle">Files are encrypted with AES-256 before storage</p>
            </div>
          </div>

          <div style={{ maxWidth: 600 }}>
            <form onSubmit={handleSubmit}>
              {/* Drop Zone */}
              <div
                id="dropzone"
                className={`dropzone ${dragActive ? 'active' : ''}`}
                onClick={() => fileInput.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                style={{ marginBottom: 24 }}
              >
                <input
                  ref={fileInput}
                  type="file"
                  id="file-input"
                  style={{ display: 'none' }}
                  onChange={(e) => e.target.files[0] && selectFile(e.target.files[0])}
                />
                {selectedFile ? (
                  <>
                    <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📄</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                      {selectedFile.name}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {formatSize(selectedFile.size)} · {selectedFile.type || 'unknown type'}
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ marginTop: 12 }}
                      onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setError(''); }}
                    >
                      <X size={14} /> Change File
                    </button>
                  </>
                ) : (
                  <>
                    <div className="dropzone-icon"><Upload size={24} /></div>
                    <p className="dropzone-title">Drag & drop your file here</p>
                    <p className="dropzone-sub">or click to browse · Max {MAX_SIZE_MB}MB</p>
                    <p className="dropzone-sub" style={{ marginTop: 6 }}>
                      PDF, Word, Excel, PowerPoint, Images, Text, ZIP, JSON
                    </p>
                  </>
                )}
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', marginBottom: 16, color: 'var(--accent-red)', fontSize: '0.875rem' }}>
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="upload-description">Description (optional)</label>
                <textarea
                  id="upload-description"
                  className="form-input"
                  rows={3}
                  placeholder="Brief description of this document..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="upload-tags">Tags (comma separated)</label>
                <input
                  id="upload-tags"
                  type="text"
                  className="form-input"
                  placeholder="e.g. report, finance, q4"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>

              {uploading && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                    <span>Uploading & encrypting...</span>
                    <span>{progress}%</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-purple))', transition: 'width 0.3s' }} />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="submit"
                  id="upload-submit"
                  className="btn btn-primary"
                  disabled={!selectedFile || uploading}
                >
                  {uploading ? 'Uploading...' : <><Upload size={16} /> Upload & Encrypt</>}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/my-files')}
                  disabled={uploading}
                >
                  Cancel
                </button>
              </div>
            </form>

            <div className="card" style={{ marginTop: 24, padding: '16px 20px' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <CheckCircle size={18} style={{ color: 'var(--accent-green)', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 4 }}>Encryption Details</div>
                  <ul style={{ color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: 1.8, paddingLeft: 0 }}>
                    <li>• AES-256-CBC encryption applied before storage</li>
                    <li>• Unique IV (Initialization Vector) per file</li>
                    <li>• Decrypted only when downloaded by authorized users</li>
                    <li>• File name and metadata stored separately from encrypted content</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadFile;
