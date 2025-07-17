import { type ReactNode } from 'react';
import { useAuth } from '../../hooks';
import LoginComponent from '../login/LoginComponent';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, loading } = useAuth();

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

  return <>{children}</>;
};

export default ProtectedRoute;

