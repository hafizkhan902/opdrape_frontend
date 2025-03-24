import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

/**
 * ProtectedRoute component that restricts access to authenticated users only
 * Redirects to login page if user is not authenticated
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAppContext();

  // Show loading state while checking authentication
  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  // Redirect to login if user is not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render the children components if authenticated
  return children;
};

export default ProtectedRoute; 