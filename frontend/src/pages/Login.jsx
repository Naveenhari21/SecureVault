import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role && user.role.toLowerCase() === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      toast.success('Welcome back!');
      if (data.user?.role && data.user.role.toLowerCase() === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Shield size={22} color="#fff" />
          </div>
          <span className="auth-logo-text">SecureVault</span>
        </div>

        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-subtitle">Sign in to access your secure documents</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-wrapper">
              <Mail size={16} className="input-icon" />
              <input
                type="email"
                id="login-email"
                className="form-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrapper">
              <Lock size={16} className="input-icon" />
              <input
                type={showPw ? 'text' : 'password'}
                id="login-password"
                className="form-input"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="input-right-icon"
                onClick={() => setShowPw(!showPw)}
                tabIndex={-1}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            id="login-submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>
            Create one
          </Link>
        </p>

        <p style={{ textAlign: 'center', marginTop: 10, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          System Administrator?{' '}
          <Link to="/admin/login" style={{ color: '#ef4444', fontWeight: 600 }}>
            Admin Portal
          </Link>
        </p>

        <div style={{ 
          marginTop: 28, padding: '14px 16px', 
          background: 'rgba(79,142,247,0.06)', 
          border: '1px solid rgba(79,142,247,0.15)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.8rem', color: 'var(--text-muted)',
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          <Shield size={14} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
          Files are encrypted with AES-256-CBC before storage
        </div>
      </div>
    </div>
  );
};

export default Login;
