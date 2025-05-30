import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Loading from '../ui/Loading';

const ProtectedRoute = ({ children, requiredRoles = [], requireAuth = true }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return <Loading fullScreen text="Verificando autenticación..." />;
  }

  // Si se requiere autenticación y el usuario no está autenticado
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si no se requiere autenticación y el usuario está autenticado, redirigir al dashboard
  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Si se especifican roles requeridos, verificar que el usuario tenga al menos uno
  if (requiredRoles.length > 0 && user) {
    const userRoles = user.roles?.map(role => role.nombre) || [];
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
