import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { AUTH_TOKEN_NAME } from '../../config/env';

/**
 * ProtectedAdminRoute component that restricts access to admin routes
 * Only users with isAdmin: true in their user object can access these routes
 */
const ProtectedAdminRoute = () => {
  const { user, isAuthenticated, loading } = useAppContext();
  const location = useLocation();
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyAdminAccess = async () => {
      setIsCheckingAdmin(true);
      setError(null);

      try {
        // Check authentication first
        const token = localStorage.getItem(AUTH_TOKEN_NAME);
        const storedIsAdmin = localStorage.getItem('isAdmin');
        
        if (!token) {
          console.log('ProtectedAdminRoute - No auth token found');
          setHasAdminAccess(false);
          return;
        }

        // Check user context first
        if (user && typeof user === 'object') {
          const isAdmin = user.isAdmin === true || user.role === 'admin';
          console.log('ProtectedAdminRoute - Checking admin status from context:', {
            user,
            isAdmin,
            role: user.role
          });
          setHasAdminAccess(isAdmin);
          return;
        }

        // Fallback to localStorage
        try {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            const isAdmin = parsedUser.isAdmin === true || parsedUser.role === 'admin' || storedIsAdmin === 'true';
            
            console.log('ProtectedAdminRoute - Checking admin status from localStorage:', {
              parsedUser,
              isAdmin,
              storedIsAdmin
            });
            
            setHasAdminAccess(isAdmin);
          } else {
            console.log('ProtectedAdminRoute - No user data in localStorage');
            setHasAdminAccess(false);
          }
        } catch (e) {
          console.error('ProtectedAdminRoute - Error parsing localStorage:', e);
          setError('Error verifying admin access');
          setHasAdminAccess(false);
        }
      } catch (error) {
        console.error('ProtectedAdminRoute - Error during admin verification:', error);
        setError('Error verifying admin access');
        setHasAdminAccess(false);
      } finally {
        setIsCheckingAdmin(false);
      }
    };

    verifyAdminAccess();
  }, [user, isAuthenticated]);

  // Show loading state while checking authentication or admin status
  if (loading || isCheckingAdmin) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Verifying admin access...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>Error: {error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  // If not authenticated, redirect to login with return URL
  if (!isAuthenticated) {
    console.log("Protected Admin Route - Not authenticated, redirecting to login");
    return <Navigate to={`/login?returnUrl=${encodeURIComponent(location.pathname)}&reason=auth_required`} replace />;
  }

  // If authenticated but not admin, redirect to unauthorized
  if (!hasAdminAccess) {
    console.log("Protected Admin Route - Not admin, redirecting to unauthorized");
    return <Navigate to="/unauthorized" replace />;
  }

  console.log("Protected Admin Route - Access granted to admin area");
  return <Outlet />;
};

export default ProtectedAdminRoute; 