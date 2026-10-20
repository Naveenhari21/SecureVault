import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const AdminLogin = () => {
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

      // Check if the logged-in user has admin role
      if (!data.user.role || data.user.role.toLowerCase() !== 'admin') {
        // Log them back out — clear token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.error('Access denied. This portal is for admins only.');
        setLoading(false);
        return;
      }

      toast.success('Welcome, Admin!');
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0e1a 0%, #1a0a0a 50%, #0a0e1a 100%)',
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: -200, left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        background: '#0f1215',
        border: '1px solid rgba(239,68,68,0.25)',
        borderRadius: 24,
        padding: '48px 44px',
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 8px 48px rgba(239,68,68,0.12)',
        position: 'relative',
        zIndex: 1,
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{
            width: 44, height: 44,
            background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(239,68,68,0.4)',
          }}>
            <Shield size={22} color="#fff" />
          </div>
          <div>
            <div style={{
              fontSize: '1.15rem', fontWeight: 700,
              background: 'linear-gradient(135deg, #ef4444, #f87171)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              SecureVault Admin
            </div>
            <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 400 }}>
              Restricted Access Portal
            </div>
          </div>
        </div>

        {/* Warning Banner */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          padding: '10px 14px', marginBottom: 28,
          background: 'rgba(239,68,68,0.07)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 10,
        }}>
          <AlertTriangle size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: '0.78rem', color: '#f87171', lineHeight: 1.6 }}>
            This portal is exclusively for system administrators. Unauthorized access attempts are logged and monitored.
          </p>
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>
          Admin Sign In
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 28 }}>
          Enter your admin credentials to access the control panel
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ color: '#94a3b8' }}>Admin Email</label>
            <div className="input-wrapper">
              <Mail size={16} className="input-icon" />
              <input
                type="email"
                className="form-input"
                placeholder="admin@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
                style={{
                  background: '#0a0d12',
                  borderColor: 'rgba(239,68,68,0.2)',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#ef4444'; e.target.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.12)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(239,68,68,0.2)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ color: '#94a3b8' }}>Password</label>
            <div className="input-wrapper">
              <Lock size={16} className="input-icon" />
              <input
                type={showPw ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password"
                style={{
                  background: '#0a0d12',
                  borderColor: 'rgba(239,68,68,0.2)',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#ef4444'; e.target.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.12)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(239,68,68,0.2)'; e.target.style.boxShadow = 'none'; }}
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
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px 20px',
              marginTop: 8,
              background: loading
                ? 'rgba(239,68,68,0.4)'
                : 'linear-gradient(135deg, #ef4444, #b91c1c)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 16px rgba(239,68,68,0.35)',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <Shield size={17} />
            {loading ? 'Authenticating...' : 'Access Admin Panel'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(239,68,68,0.15)' }} />
          <span style={{ fontSize: '0.75rem', color: '#4b5563' }}>OR</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(239,68,68,0.15)' }} />
        </div>

        <Link
          to="/login"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '11px 20px',
            background: 'transparent',
            color: '#94a3b8',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            fontSize: '0.875rem',
            fontWeight: 500,
            transition: 'all 0.2s',
            textDecoration: 'none',
          }}
          onMouseOver={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#e2e8f0'; }}
          onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#94a3b8'; }}
        >
          Back to User Login
        </Link>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.72rem', color: '#374151' }}>
          🔒 All admin actions are recorded in the audit log
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
