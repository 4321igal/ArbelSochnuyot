import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth/AuthContext';

/**
 * Admin Route Guard
 * 
 * Redirects non-admin users to home page
 */
export function AdminRoute() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to auth page
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  if (!isAdmin) {
    // Redirect non-admin users to home
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
