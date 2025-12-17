import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loader from './Loader';

export default function ProtectedRoute({
  children,
  requireOnboarding = false,
  requireAdmin = false,
  requireDoctor = false,
  requireOrganization = false
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
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireDoctor && !user.is_doctor) {
    // If user is a doctor but not verified, show pending message
    if (user.user_type === 'doctor') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-cream-100 px-6">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-dark-900 mb-4">Verification Pending</h1>
            <p className="text-dark-600 mb-8">
              Your doctor account is pending verification. Our team will review your credentials and you'll receive an email once approved.
            </p>
          </div>
        </div>
      );
    }
    return <Navigate to="/login" replace />;
  }

  if (requireOrganization && user.user_type !== 'organization') {
    // If user is an organization staff but org not verified, show pending message
    if (user.user_type === 'organization') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-cream-100 px-6">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-dark-900 mb-4">Verification Pending</h1>
            <p className="text-dark-600 mb-8">
              Your organization is pending verification. Our team will review your details and you'll receive an email once approved.
            </p>
          </div>
        </div>
      );
    }
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !user.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireOnboarding && !user.onboarding_complete) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}
