import { Loader2 } from 'lucide-react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedAdminRoute() {
  const { canAccessAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#EB216A]" />
      </div>
    );
  }

  if (!canAccessAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
