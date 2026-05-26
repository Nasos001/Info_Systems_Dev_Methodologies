import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: Array<'citizen' | 'admin' | 'technician'>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { session, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (session && !allowedRoles.includes(session.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const RoleGuard = ({ role }: { role: 'citizen' | 'admin' | 'technician' }) => {
  return (
    <ProtectedRoute allowedRoles={[role]}>
      <Outlet />
    </ProtectedRoute>
  );
};
