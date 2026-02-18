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

  // דפים פתוחים לכל משתמש מחובר (לא רק Admin)
  const allowedExact = ['/admin/import-csv', '/admin/categories'];
  const allowedPrefix = ['/admin/products'];
  if (allowedExact.some((path) => location.pathname === path)) {
    return <Outlet />;
  }
  if (allowedPrefix.some((path) => location.pathname.startsWith(path))) {
    return <Outlet />;
  }

  if (!isAdmin) {
    // Redirect non-admin users to home (rest of admin pages)
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
