import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="spinner-container" style={{ height: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!user.role || user.role.toLowerCase() !== 'admin') return <Navigate to="/dashboard" replace />;

  return children;
};

export default AdminRoute;
