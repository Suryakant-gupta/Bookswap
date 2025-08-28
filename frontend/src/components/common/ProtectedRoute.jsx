import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from '../../services/auth';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = authService.isLoggedIn();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login with the current location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;