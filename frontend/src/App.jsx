import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

import Login            from './pages/Login';
import Register         from './pages/Register';
import Dashboard        from './pages/Dashboard';
import MyFiles          from './pages/MyFiles';
import SharedWithMe     from './pages/SharedWithMe';
import UploadFile       from './pages/UploadFile';
import FileDetails      from './pages/FileDetails';
import VersionHistory   from './pages/VersionHistory';
import ManagePermissions from './pages/ManagePermissions';
import ActivityLogs     from './pages/ActivityLogs';
import Profile          from './pages/Profile';

// Admin pages
import AdminDashboard   from './pages/admin/AdminDashboard';
import AdminUsers       from './pages/admin/AdminUsers';
import AdminFiles       from './pages/admin/AdminFiles';
import AdminLogs        from './pages/admin/AdminLogs';
import AdminLogin       from './pages/admin/AdminLogin';

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="spinner-container" style={{ height: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role && user.role.toLowerCase() === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#131929',
              color: '#e8eaf6',
              border: '1px solid #1e2d4d',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.875rem',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        <Routes>
          {/* Public routes */}
          <Route path="/login"       element={<Login />} />
          <Route path="/register"    element={<Register />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/my-files"  element={<ProtectedRoute><MyFiles /></ProtectedRoute>} />
          <Route path="/shared"    element={<ProtectedRoute><SharedWithMe /></ProtectedRoute>} />
          <Route path="/upload"    element={<ProtectedRoute><UploadFile /></ProtectedRoute>} />
          <Route path="/files/:id"             element={<ProtectedRoute><FileDetails /></ProtectedRoute>} />
          <Route path="/files/:id/versions"    element={<ProtectedRoute><VersionHistory /></ProtectedRoute>} />
          <Route path="/files/:id/permissions" element={<ProtectedRoute><ManagePermissions /></ProtectedRoute>} />
          <Route path="/activity"  element={<ProtectedRoute><ActivityLogs /></ProtectedRoute>} />
          <Route path="/profile"   element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Root redirect (role-aware) */}
          <Route path="/"     element={<RootRedirect />} />

          {/* Admin routes — admin role required */}
          <Route path="/admin"        element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/users"  element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/files"  element={<AdminRoute><AdminFiles /></AdminRoute>} />
          <Route path="/admin/logs"   element={<AdminRoute><AdminLogs /></AdminRoute>} />

          <Route path="*"     element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
