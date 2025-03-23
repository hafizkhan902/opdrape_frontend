import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

/**
 * ProtectedAdminRoute component that restricts access to admin routes
 * Only users with isAdmin: true in their user object can access these routes
 */
const ProtectedAdminRoute = () => {
  const { user, isAuthenticated, loading } = useAppContext();

  // Debug user details
  useEffect(() => {
    console.log("Protected Admin Route - Auth state:", { isAuthenticated, loading });
    console.log("Protected Admin Route - User data:", user);
    console.log("Protected Admin Route - User isAdmin:", user?.isAdmin);
    console.log("Protected Admin Route - User role:", user?.role);

    // Check localStorage to see what's stored
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        console.log("Protected Admin Route - localStorage user:", parsedUser);
        console.log("Protected Admin Route - localStorage isAdmin:", parsedUser.isAdmin);
      } else {
        console.log("Protected Admin Route - No user in localStorage");
      }
    } catch (e) {
      console.error("Protected Admin Route - Error checking localStorage:", e);
    }
  }, [user, isAuthenticated, loading]);

  // Show loading state while checking authentication
  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  // Check if user is authenticated and has admin role
  if (!isAuthenticated || !user) {
    console.log("Protected Admin Route - Not authenticated or no user object");
    return <Navigate to="/unauthorized" replace />;
  }

  // Check for admin role - allow both isAdmin and role === 'admin'
  const hasAdminPrivileges = user.isAdmin === true || user.role === 'admin';
  
  if (!hasAdminPrivileges) {
    console.log("Protected Admin Route - User does not have admin privileges");
    return <Navigate to="/unauthorized" replace />;
  }

  console.log("Protected Admin Route - Access granted to admin area");
  // Render the protected admin routes
  return <Outlet />;
};

export default ProtectedAdminRoute; 