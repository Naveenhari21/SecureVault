import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import FileCard from '../components/FileCard';
import api from '../api/axios';
import toast from 'react-hot-toast';

const MyFiles = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (search) params.search = search;
      if (tag)    params.tag = tag;
      const { data } = await api.get('/files', { params });
      setFiles(data.files);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) {
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [page, search, tag]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const handleDelete = (id) => setFiles((prev) => prev.filter((f) => f._id !== id));

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar title="My Files" />
        <div className="page-content">
          <div className="page-header">
            <div>
              <h1 className="page-title">My Files</h1>
              <p className="page-subtitle">{total} document{total !== 1 ? 's' : ''} uploaded</p>
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/upload')}>
              <Plus size={18} /> Upload File
            </button>
          </div>

          {/* Search */}
          <div className="search-bar">
            <div className="search-input-wrapper">
              <Search size={16} />
              <input
                id="file-search"
                type="text"
                placeholder="Search files..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <input
              id="tag-filter"
              className="form-input"
              style={{ maxWidth: 200 }}
              placeholder="Filter by tag..."
              value={tag}
              onChange={(e) => { setTag(e.target.value); setPage(1); }}
            />
          </div>

          {loading ? (
            <div className="spinner-container"><div className="spinner" /></div>
          ) : files.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="empty-title">No files found</h3>
              <p className="empty-subtitle">{search || tag ? 'Try different search terms' : 'Upload your first document to get started'}</p>
              {!search && !tag && (
                <button className="btn btn-primary" onClick={() => navigate('/upload')}>
                  <Plus size={16} /> Upload File
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="file-grid">
                {files.map((file) => (
                  <FileCard key={file._id} file={file} onDelete={handleDelete} />
                ))}
              </div>
              {pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
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

export default MyFiles;
