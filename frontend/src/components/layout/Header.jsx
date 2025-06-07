import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  LogOut, 
  Settings, 
  Bell, 
  Menu, 
  X,
  ChevronDown 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import { helpers } from '../../utils/helpers';

const Header = ({ onMenuToggle, isMobileMenuOpen }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);


  const handleLogout = async () => {
    await logout();
  };

  const getRoleDisplayName = (roles) => {
    if (!roles || roles.length === 0) return 'Usuario';
    
    // Check if user is admin
    const isAdmin = roles.some(role => role.nombre === 'administrador');
    if (isAdmin) {
      return 'Admin';
    }
    
    const roleNames = {
      docente: 'Docente',
      estudiante: 'Estudiante'
    };
    
    return roles.map(role => roleNames[role.nombre] || role.nombre).join(', ');
  };

  const getDisplayInitials = (user) => {
    if (!user) return '';
    
    // For admin users, just return "A"
    if (user.roles && user.roles.some(role => role.nombre === 'administrador')) {
      return 'A';
    }
    
    // For other users, return initials
    return helpers.getInitials(user.nombre + ' ' + user.apellido);
  };

  return (
    <header className="bg-white shadow-sm border-b border-secondary-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo y botón de menú móvil */}
          <div className="flex items-center">
            <button
              type="button"
              className="md:hidden p-2 rounded-md text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              onClick={onMenuToggle}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
            
            <Link to="/dashboard" className="flex items-center ml-4 md:ml-0">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">U</span>
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-sm sm:text-base md:text-lg font-semibold text-secondary-900">
                  <span className="hidden sm:inline">Sistema Académico</span>
                  <span className="sm:hidden">PROY</span>
                </h1>
                <p className="text-xs text-secondary-600 hidden sm:block">PROY</p>
              </div>
            </Link>
          </div>

          {/* Navegación del usuario */}
          <div className="flex items-center space-x-4">
           

            {/* Menú de usuario */}
            <div className="relative">
              <button
                type="button"
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${helpers.getAvatarColor(user?.nombre + ' ' + user?.apellido)}`}>
                  {getDisplayInitials(user)}
                </div>
                
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-secondary-900">
                    {user?.nombre} {user?.apellido}
                  </p>
                  <p className="text-xs text-secondary-600">
                    {getRoleDisplayName(user?.roles)}
                  </p>
                </div>
                
                <ChevronDown className="w-4 h-4 text-secondary-600" />
              </button>

              {/* Dropdown del usuario */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    {/* Información del usuario en móvil */}
                    <div className="md:hidden px-4 py-3 border-b border-secondary-200">
                      <p className="text-sm font-medium text-secondary-900">
                        {user?.nombre} {user?.apellido}
                      </p>
                      <p className="text-xs text-secondary-600">
                        {user?.correo}
                      </p>
                      <p className="text-xs text-secondary-600">
                        {getRoleDisplayName(user?.roles)}
                      </p>
                    </div>

                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="w-4 h-4 mr-3" />
                      Mi Perfil
                    </Link>


                    <div className="border-t border-secondary-200">
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay para cerrar menús al hacer clic fuera */}
      {(showUserMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
          }}
        />
      )}
    </header>
  );
};

export default Header;
