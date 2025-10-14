import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { Loader2 } from 'lucide-react';

// No props interface needed - using Outlet pattern
export default function AdminProtectedRoute() {
  const { isAuthenticated, isLoading, user } = useAppSelector((state) => state.auth);

  // Show loader while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Проверка доступа...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated and is admin
  if (!isAuthenticated || !user?.is_staff) {
    return <Navigate to="/admin/login" replace />;
  }

  // Render nested routes via Outlet
  return <Outlet />;
}