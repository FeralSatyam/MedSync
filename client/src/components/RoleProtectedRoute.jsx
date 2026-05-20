import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function RoleProtectedRoute({ children, allowedRoles }) {
  const { user, hydrated, loading } = useAuthStore();
  const location = useLocation();

  if (!hydrated || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="text-muted font-body text-[14px]">Loading secure portal…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If a pharmacist tries to access patient pages, or vice versa, redirect them to their home
    const redirectPath = user.role === 'pharmacist' ? '/pharmacist/dashboard' : '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}
