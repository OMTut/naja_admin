import { type ReactNode } from 'react';
import { useAuth } from '../../hooks';
import LoginComponent from '../login/LoginComponent';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
  requiredPermission?: string;
}

const ProtectedRoute = ({ children, requiredRoles, requiredPermission }: ProtectedRouteProps) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginComponent />;
  }

  if (requiredPermission) {
    const userPermissions = user?.permissions ?? [];
    if (!userPermissions.includes(requiredPermission)) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--naja-gold)' }}>Access Denied</h2>
          <p style={{ color: 'var(--naja-text)' }}>
            You don't have permission to view this page.
          </p>
        </div>
      );
    }
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const userRoles = user?.roles ?? [];
    const hasRole = requiredRoles.some(r => userRoles.includes(r));
    if (!hasRole) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--naja-gold)' }}>Access Denied</h2>
          <p style={{ color: 'var(--naja-text)' }}>
            You don't have permission to view this page.
          </p>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
