// src/routes/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useProfile } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';

export function ProtectedRoute() {
  const { data: user, isLoading, error } = useProfile();

  console.log('Protected route state:', { user, isLoading, error });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error) {
    console.error('Protected route error:', error);
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}