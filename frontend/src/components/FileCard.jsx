import { useNavigate } from 'react-router-dom';
import { Download, Trash2, Share2, Eye, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '../api/axios';
import toast from 'react-hot-toast';

const FILE_ICONS = {
  'application/pdf': { icon: '📄', bg: '#ef4444', color: 'rgba(239,68,68,0.15)' },
  'application/msword': { icon: '📝', bg: '#4f8ef7', color: 'rgba(79,142,247,0.15)' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: '📝', bg: '#4f8ef7', color: 'rgba(79,142,247,0.15)' },
  'application/vnd.ms-excel': { icon: '📊', bg: '#10b981', color: 'rgba(16,185,129,0.15)' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: '📊', bg: '#10b981', color: 'rgba(16,185,129,0.15)' },
  'application/vnd.ms-powerpoint': { icon: '📊', bg: '#f59e0b', color: 'rgba(245,158,11,0.15)' },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { icon: '📊', bg: '#f59e0b', color: 'rgba(245,158,11,0.15)' },
  'text/plain': { icon: '📃', bg: '#8892b0', color: 'rgba(136,146,176,0.15)' },
  'text/csv': { icon: '📊', bg: '#10b981', color: 'rgba(16,185,129,0.15)' },
  'image/jpeg': { icon: '🖼️', bg: '#8b5cf6', color: 'rgba(139,92,246,0.15)' },
  'image/png': { icon: '🖼️', bg: '#8b5cf6', color: 'rgba(139,92,246,0.15)' },
  'application/zip': { icon: '🗜️', bg: '#f59e0b', color: 'rgba(245,158,11,0.15)' },
  'application/json': { icon: '🔧', bg: '#06b6d4', color: 'rgba(6,182,212,0.15)' },
};

const getFileInfo = (mimeType) =>
  FILE_ICONS[mimeType] || { icon: '📁', bg: '#8892b0', color: 'rgba(136,146,176,0.15)' };

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const FileCard = ({ file, onDelete, showOwner = false }) => {
  const navigate = useNavigate();
  const { icon, color } = getFileInfo(file.mimeType);

  const handleDownload = async (e) => {
    e.stopPropagation();
    try {
      const response = await api.get(`/files/${file._id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = file.originalName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Download failed');
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${file.originalName}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/files/${file._id}`);
      toast.success('File deleted');
      if (onDelete) onDelete(file._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="file-card" onClick={() => navigate(`/files/${file._id}`)}>
      <div className="file-card-icon" style={{ background: color }}>
        <span style={{ fontSize: '1.4rem' }}>{icon}</span>
      </div>
      <div className="file-card-name" title={file.originalName}>{file.originalName}</div>
      <div className="file-card-meta">
        <span>{formatSize(file.size)}</span>
        {showOwner && file.owner && <span>by {file.owner.username}</span>}
        <span title={new Date(file.createdAt).toLocaleString()}>
          {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
        </span>
      </div>
      {file.tags?.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
          {file.tags.map((tag) => (
            <span key={tag} className="badge badge-blue" style={{ fontSize: '0.7rem' }}>{tag}</span>
          ))}
        </div>
      )}
      <div className="file-card-actions" onClick={(e) => e.stopPropagation()}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/files/${file._id}`)}>
          <Eye size={14} /> View
        </button>
        <button className="btn btn-secondary btn-sm" onClick={handleDownload}>
          <Download size={14} />
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/files/${file._id}/permissions`)}>
          <Share2 size={14} />
        </button>
        {onDelete && (
          <button className="btn btn-danger btn-sm" onClick={handleDelete}>
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export { getFileInfo, formatSize };
export default FileCard;
