// src/components/auth/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DEV_CONFIG } from '@/config/dev-config';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // If dev bypass is enabled, always render children without protection
  if (DEV_CONFIG.BYPASS_AUTH) {
    console.log('Development mode: Authentication bypass enabled for protected route');
    return <>{children}</>;
  }

  // Normal authentication check
  if (!isAuthenticated) {
    console.log('User not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};