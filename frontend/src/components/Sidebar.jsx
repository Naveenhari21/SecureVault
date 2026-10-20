import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Files, Share2, Upload, Activity,
  User, Shield, LogOut, Lock, Users, HardDrive, ScrollText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/my-files',     icon: Files,           label: 'My Files' },
  { to: '/shared',       icon: Share2,          label: 'Shared With Me' },
  { to: '/upload',       icon: Upload,          label: 'Upload File' },
];

const settingsItems = [
  { to: '/activity',     icon: Activity,        label: 'Activity Logs' },
  { to: '/profile',      icon: User,            label: 'Profile' },
];

const adminItems = [
  { to: '/admin',        icon: Shield,          label: 'Admin Dashboard' },
  { to: '/admin/users',  icon: Users,           label: 'Manage Users' },
  { to: '/admin/files',  icon: HardDrive,       label: 'All Files' },
  { to: '/admin/logs',   icon: ScrollText,      label: 'System Logs' },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const initials = user
    ? (user.firstName?.[0] || user.username?.[0] || '?').toUpperCase()
    : '?';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Shield size={20} color="#fff" />
        </div>
        <div>
          <div className="sidebar-logo-text">SecureVault</div>
          <div className="sidebar-logo-sub">Document Management</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Main</div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}

        <div className="sidebar-section-label">Settings</div>
        {settingsItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}

        {user?.role && user.role.toLowerCase() === 'admin' && (
          <>
            <div className="sidebar-section-label" style={{ color: '#ef4444' }}>Admin</div>
            {adminItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/admin'}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                style={({ isActive }) => isActive ? { borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444' } : {}}
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </>
        )}

        <button
          className="sidebar-link"
          onClick={handleLogout}
          style={{ width: '100%', background: 'none', cursor: 'pointer' }}
        >
          <LogOut size={18} />
          Logout
        </button>
      </nav>

      <div className="sidebar-user">
        <div className="sidebar-user-card">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.username || 'User'}</div>
            <div className="sidebar-user-role">{user?.role || 'user'}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
