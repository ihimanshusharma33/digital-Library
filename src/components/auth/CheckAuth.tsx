import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';

interface CheckAuthProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'staff' | 'student' | null;
  redirectTo?: string;
  authPage?: boolean;
}

/**
 * CheckAuth - Simplified component that handles basic authentication routing logic
 * 
 * @param children - Components to render if authentication check passes
 * @param requiredRole - Required user role ('admin', 'staff', 'student', or null for any authenticated user)
 * @param redirectTo - Path to redirect to if check fails (defaults to /signin)
 * @param authPage - Whether this is an authentication page (signin/signup) which should redirect 
 *                   authenticated users away
 */
const CheckAuth: React.FC<CheckAuthProps> = ({ 
  children, 
  requiredRole = null, 
  redirectTo = '/signin', 
  authPage = false 
}) => {
  const { isAuthenticated, user, token, loading } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Only complete the check once the auth context has finished loading
    if (!loading) {
      setIsChecking(false);
    }
  }, [loading]);

  // Show loading spinner while checking authentication
  if (isChecking || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Handle auth pages (signin/signup)
  if (authPage) {
    // If we're on an auth page and user is already authenticated, 
    // redirect to the appropriate dashboard
    if (isAuthenticated && token && user) {
      // Redirect based on user role
      if (user.role === 'admin' || user.role === 'staff') {
        return <Navigate to="/admin" replace />;
      } else if (user.role === 'student') {
        return <Navigate to="/student" replace />;
      }
      return <Navigate to="/" replace />;
    }
    // Not authenticated, show the auth page
    return <>{children}</>;
  }

  // For protected routes

  // Check if user is authenticated and has a token
  if (!isAuthenticated || !token || !user) {
    // User not authenticated or missing token, redirect to signin
    return <Navigate to={redirectTo} replace />;
  }

  // Check role requirements if specified
  if (requiredRole) {
    const isAdmin = user.role === 'admin';
    const isStaff = user.role === 'staff';
    const isStudent = user.role === 'student';

    // Check if user has the required role
    // Note: For 'admin' routes, we allow both admin and staff roles
    if (
      (requiredRole === 'admin' && !(isAdmin || isStaff)) || 
      (requiredRole === 'staff' && !isStaff) || 
      (requiredRole === 'student' && !isStudent)
    ) {
      // User doesn't have the required role, redirect based on their actual role
      if (isAdmin || isStaff) {
        return <Navigate to="/admin" replace />;
      } else if (isStudent) {
        return <Navigate to="/student" replace />;
      } else {
        return <Navigate to={redirectTo} replace />;
      }
    }
  }

  // All checks passed, render the children
  return <>{children}</>;
};

export default CheckAuth;