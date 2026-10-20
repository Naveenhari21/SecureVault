import { useState } from 'react';
import { User, Mail, Lock, Save, Shield } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    username: user?.username || '',
  });
  const [passwords, setPasswords] = useState({ current: '', newPw: '', confirm: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await api.put('/auth/profile', profile);
      updateUser(data.user);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwords.newPw !== passwords.confirm) { toast.error('Passwords do not match'); return; }
    if (passwords.newPw.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setSavingPw(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwords.current,
        newPassword: passwords.newPw,
      });
      toast.success('Password changed successfully');
      setPasswords({ current: '', newPw: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPw(false);
    }
  };

  const initials = ((user?.firstName?.[0] || '') + (user?.lastName?.[0] || '') || user?.username?.[0] || '?').toUpperCase();

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Profile" />
        <div className="page-content">
          <div className="page-header">
            <div>
              <h1 className="page-title">Profile Settings</h1>
              <p className="page-subtitle">Manage your account information and security</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
            {/* Profile Info */}
            <div>
              <div className="card" style={{ marginBottom: 20 }}>
                {/* Avatar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.6rem', fontWeight: 700, color: '#fff',
                  }}>
                    {initials}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                      {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{user?.email}</div>
                    <div style={{ marginTop: 4 }}>
                      <span className="badge badge-purple">{user?.role}</span>
                    </div>
                  </div>
                </div>

                <h3 className="card-title" style={{ marginBottom: 16 }}>Personal Information</h3>
                <form onSubmit={handleProfileSave}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group">
                      <label className="form-label">First Name</label>
                      <input id="profile-first" className="form-input" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last Name</label>
                      <input id="profile-last" className="form-input" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <div className="input-wrapper">
                      <User size={16} className="input-icon" />
                      <input id="profile-username" type="text" className="form-input" value={profile.username} onChange={(e) => setProfile({ ...profile, username: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email (read-only)</label>
                    <div className="input-wrapper">
                      <Mail size={16} className="input-icon" />
                      <input type="email" className="form-input" value={user?.email || ''} readOnly style={{ opacity: 0.6 }} />
                    </div>
                  </div>
                  <button type="submit" id="save-profile-btn" className="btn btn-primary" disabled={savingProfile}>
                    <Save size={16} /> {savingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>
            </div>

            <div>
              {/* Change Password */}
              <div className="card" style={{ marginBottom: 20 }}>
                <h3 className="card-title" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Lock size={18} style={{ color: 'var(--accent-amber)' }} /> Change Password
                </h3>
                <form onSubmit={handlePasswordSave}>
                  <div className="form-group">
                    <label className="form-label">Current Password</label>
                    <input id="current-pw" type="password" className="form-input" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} placeholder="Current password" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <input id="new-pw" type="password" className="form-input" value={passwords.newPw} onChange={(e) => setPasswords({ ...passwords, newPw: e.target.value })} placeholder="Min 6 characters" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirm New Password</label>
                    <input id="confirm-pw" type="password" className="form-input" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} placeholder="Repeat new password" />
                  </div>
                  <button type="submit" id="change-pw-btn" className="btn btn-primary" disabled={savingPw}>
                    <Lock size={16} /> {savingPw ? 'Updating...' : 'Change Password'}
                  </button>
                </form>
              </div>

              {/* Account Info */}
              <div className="card">
                <h3 className="card-title" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Shield size={18} style={{ color: 'var(--accent-green)' }} /> Account Security
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.875rem' }}>
                  {[
                    { label: 'Account Status', value: user?.isActive ? 'Active' : 'Inactive', color: user?.isActive ? 'var(--accent-green)' : 'var(--accent-red)' },
                    { label: 'Role', value: user?.role || 'user', color: 'var(--accent-purple)' },
                    { label: 'Member Since', value: user?.createdAt ? format(new Date(user.createdAt), 'MMMM d, yyyy') : 'N/A', color: 'var(--text-secondary)' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                      <span style={{ fontWeight: 600, color }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
