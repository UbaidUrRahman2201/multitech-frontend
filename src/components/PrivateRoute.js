import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tech-dark">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-tech-blue"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'Admin' ? '/admin' : '/employee'} />;
  }

  return children;
};

export default PrivateRoute;