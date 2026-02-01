import { Loader2 } from 'lucide-react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedFinanceRoute() {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-[#EB216A]" />
            </div>
        );
    }

    // Allow FINANCE, ADMIN, and SUPERADMIN
    const role = user?.role?.toUpperCase();
    const allowed = ['FINANCE', 'ADMIN', 'SUPERADMIN'].includes(role || '');

    if (!allowed) {
        return <Navigate to="/admin/dashboard" state={{ from: location }} replace />;
    }

    return <Outlet />;
}
