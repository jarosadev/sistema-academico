import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Loading from '../ui/Loading';

const RoleBasedRoute = ({ 
  children, 
  allowedRoles = [], 
  fallbackPath = '/dashboard',
  showUnauthorized = false 
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return <Loading fullScreen text="Verificando permisos..." />;
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si no hay roles especificados, permitir acceso
  if (allowedRoles.length === 0) {
    return children;
  }

  // Verificar si el usuario tiene alguno de los roles permitidos
  const userRoles = user?.roles?.map(role => role.nombre) || [];
  const hasAllowedRole = allowedRoles.some(role => userRoles.includes(role));

  if (!hasAllowedRole) {
    if (showUnauthorized) {
      return <Navigate to="/unauthorized" replace />;
    }
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};

// Hook personalizado para verificar roles
export const useRoleCheck = () => {
  const { user } = useAuth();

  const hasRole = (roleName) => {
    if (!user || !user.roles) return false;
    return user.roles.some(role => role.nombre === roleName);
  };

  const hasAnyRole = (roleNames) => {
    if (!user || !user.roles) return false;
    return roleNames.some(roleName => 
      user.roles.some(role => role.nombre === roleName)
    );
  };

  const hasAllRoles = (roleNames) => {
    if (!user || !user.roles) return false;
    return roleNames.every(roleName => 
      user.roles.some(role => role.nombre === roleName)
    );
  };

  const getUserRoles = () => {
    return user?.roles?.map(role => role.nombre) || [];
  };

  const isAdmin = () => hasRole('administrador');
  const isTeacher = () => hasRole('docente');
  const isStudent = () => hasRole('estudiante');

  return {
    hasRole,
    hasAnyRole,
    hasAllRoles,
    getUserRoles,
    isAdmin,
    isTeacher,
    isStudent,
    userRoles: getUserRoles()
  };
};

export default RoleBasedRoute;
