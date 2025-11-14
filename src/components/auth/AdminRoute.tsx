import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/utils/permissions';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin(user)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
