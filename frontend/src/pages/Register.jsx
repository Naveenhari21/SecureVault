import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '', email: '', password: '', confirmPassword: '', firstName: '', lastName: ''
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) {
      toast.error('Username, email and password are required');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register({
        username: form.username,
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
      });
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Shield size={22} color="#fff" />
          </div>
          <span className="auth-logo-text">SecureVault</span>
        </div>

        <h2 className="auth-title">Create account</h2>
        <p className="auth-subtitle">Join SecureVault to protect your documents</p>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input id="reg-first" className="form-input" placeholder="John" value={form.firstName} onChange={set('firstName')} />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input id="reg-last" className="form-input" placeholder="Doe" value={form.lastName} onChange={set('lastName')} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Username *</label>
            <div className="input-wrapper">
              <User size={16} className="input-icon" />
              <input id="reg-username" type="text" className="form-input" placeholder="johndoe" value={form.username} onChange={set('username')} autoComplete="username" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <div className="input-wrapper">
              <Mail size={16} className="input-icon" />
              <input id="reg-email" type="email" className="form-input" placeholder="you@example.com" value={form.email} onChange={set('email')} autoComplete="email" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password *</label>
            <div className="input-wrapper">
              <Lock size={16} className="input-icon" />
              <input
                id="reg-password"
                type={showPw ? 'text' : 'password'}
                className="form-input"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={set('password')}
                autoComplete="new-password"
              />
              <button type="button" className="input-right-icon" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password *</label>
            <div className="input-wrapper">
              <Lock size={16} className="input-icon" />
              <input
                id="reg-confirm-password"
                type="password"
                className="form-input"
                placeholder="Repeat password"
                value={form.confirmPassword}
                onChange={set('confirmPassword')}
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            id="reg-submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
