import { Bell, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Navbar = ({ title }) => {
  const { user } = useAuth();
  const initials = user
    ? (user.firstName?.[0] || user.username?.[0] || '?').toUpperCase()
    : '?';

  return (
    <header className="navbar">
      <h1 className="navbar-title">{title}</h1>
      <div className="navbar-actions">
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Welcome, <strong style={{ color: 'var(--text-primary)' }}>{user?.firstName || user?.username}</strong>
        </div>
        <div className="sidebar-avatar" style={{ width: 34, height: 34, fontSize: '0.8rem' }}>
          {initials}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
