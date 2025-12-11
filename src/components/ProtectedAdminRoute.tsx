import { Navigate, Outlet } from 'react-router-dom';

export function ProtectedAdminRoute() {
  const isAdminAuth = localStorage.getItem('adminAuth') === 'true';

  if (!isAdminAuth) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
