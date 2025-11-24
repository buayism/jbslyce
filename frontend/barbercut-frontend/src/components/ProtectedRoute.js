import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowRoles }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    try { sessionStorage.setItem('bc_post_login_redirect', location.pathname + location.search); } catch {}
    return <Navigate to="/signin" replace />;
  }

  if (allowRoles && Array.isArray(allowRoles) && !allowRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
