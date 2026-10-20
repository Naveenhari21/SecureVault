import { useState, useEffect } from 'react';
import { Share2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import FileCard from '../components/FileCard';
import api from '../api/axios';
import toast from 'react-hot-toast';

const SharedWithMe = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShared = async () => {
      try {
        const { data } = await api.get('/files/shared');
        setFiles(data.files);
      } catch {
        toast.error('Failed to load shared files');
      } finally {
        setLoading(false);
      }
    };
    fetchShared();
  }, []);

  const permBadge = (perm) => {
    const map = { view: 'badge-blue', edit: 'badge-green', owner: 'badge-purple' };
    return map[perm] || 'badge-gray';
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Shared With Me" />
        <div className="page-content">
          <div className="page-header">
            <div>
              <h1 className="page-title">Shared With Me</h1>
              <p className="page-subtitle">{files.length} file{files.length !== 1 ? 's' : ''} shared with you</p>
            </div>
          </div>

          {loading ? (
            <div className="spinner-container"><div className="spinner" /></div>
          ) : files.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Share2 size={28} /></div>
              <h3 className="empty-title">No shared files</h3>
              <p className="empty-subtitle">Files shared with you by other users will appear here</p>
            </div>
          ) : (
            <div className="file-grid">
              {files.map((file) => (
                <div key={file._id} style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 1 }}>
                    <span className={`badge ${permBadge(file.myPermission)}`}>{file.myPermission}</span>
                  </div>
                  <FileCard file={file} showOwner />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SharedWithMe;
