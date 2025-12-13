import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loader from './Loader';

export default function ProtectedRoute({
  children,
  requireOnboarding = false,
  requireAdmin = false,
  requireDoctor = false
}) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirectTo = requireDoctor ? '/doctor/login' : '/login';
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (requireDoctor && !user.is_doctor) {
    return <Navigate to="/doctor/login" replace />;
  }

  if (requireAdmin && !user.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireOnboarding && !user.onboarding_complete) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}
