import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  BarChart3,
  Settings,
  Shield,
  UserCheck,
  ClipboardList,
  Award,
  Calendar,
  Database
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Configuración de navegación por rol
  const getNavigationItems = () => {
    if (!user || !user.roles) return [];

    const userRoles = user.roles.map(role => role.nombre);
    const items = [];

    // Dashboard - común para todos
    items.push({
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      roles: ['administrador', 'docente', 'estudiante']
    });

    // Administrador
    if (userRoles.includes('administrador')) {
      items.push(
        {
          name: 'Estudiantes',
          href: '/estudiantes',
          icon: Users,
          roles: ['administrador']
        },
        {
          name: 'Docentes',
          href: '/docentes',
          icon: UserCheck,
          roles: ['administrador']
        },
        {
          name: 'Materias',
          href: '/materias',
          icon: BookOpen,
          roles: ['administrador']
        },
        {
          name: 'Menciones',
          href: '/menciones',
          icon: GraduationCap,
          roles: ['administrador']
        },
        {
          name: 'Inscripciones',
          href: '/inscripciones',
          icon: ClipboardList,
          roles: ['administrador']
        },
        {
          name: 'Notas',
          href: '/notas',
          icon: Award,
          roles: ['administrador']
        },
        {
          name: 'Reportes',
          href: '/reportes',
          icon: BarChart3,
          roles: ['administrador']
        },
        {
          name: 'Auditoría',
          href: '/auditoria',
          icon: Shield,
          roles: ['administrador']
        }
      );
    }

    // Docente
    if (userRoles.includes('docente')) {
      items.push(
        {
          name: 'Mis Materias',
          href: '/mis-materias',
          icon: BookOpen,
          roles: ['docente']
        },
        {
          name: 'Mis Estudiantes',
          href: '/mis-estudiantes',
          icon: Users,
          roles: ['docente']
        },
        {
          name: 'Calificaciones',
          href: '/calificaciones',
          icon: Award,
          roles: ['docente']
        },
        {
          name: 'Horarios',
          href: '/horarios',
          icon: Calendar,
          roles: ['docente']
        },
        {
          name: 'Reportes',
          href: '/reportes-docente',
          icon: FileText,
          roles: ['docente']
        }
      );
    }

    // Estudiante
    if (userRoles.includes('estudiante')) {
      items.push(
        {
          name: 'Mis Materias',
          href: '/mis-materias',
          icon: BookOpen,
          roles: ['estudiante']
        },
        {
          name: 'Mis Notas',
          href: '/mis-notas',
          icon: Award,
          roles: ['estudiante']
        },
        {
          name: 'Inscripciones',
          href: '/mis-inscripciones',
          icon: ClipboardList,
          roles: ['estudiante']
        },
        {
          name: 'Horarios',
          href: '/mis-horarios',
          icon: Calendar,
          roles: ['estudiante']
        },
        {
          name: 'Historial',
          href: '/historial-academico',
          icon: Database,
          roles: ['estudiante']
        }
      );
    }

    // Configuración - común para todos
    items.push({
      name: 'Configuración',
      href: '/settings',
      icon: Settings,
      roles: ['administrador', 'docente', 'estudiante']
    });

    return items.filter(item => 
      item.roles.some(role => userRoles.includes(role))
    );
  };

  const navigationItems = getNavigationItems();

  const isActiveLink = (href) => {
    return location.pathname === href;
  };

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0 md:h-full ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full max-h-full">
          {/* Header del sidebar */}
          <div className="flex items-center justify-center h-16 px-4 bg-primary-600 flex-shrink-0">
            <div className="flex items-center w-full">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-primary-600 font-bold text-sm">U</span>
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <h2 className="text-white font-semibold text-sm truncate">Sistema Académico</h2>
                {/* <p className="text-primary-200 text-xs">UMSA</p> */}
              </div>
            </div>
          </div>

          {/* Navegación */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar min-h-0">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveLink(item.href);
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                      : 'text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-3 flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-secondary-500'}`} />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer del sidebar */}
          <div className="p-4 border-t border-secondary-200 flex-shrink-0 bg-white">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-white text-sm font-semibold">
                  {user?.nombre?.charAt(0)?.toUpperCase()}{user?.apellido?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-secondary-900 truncate">
                  {user?.nombre} {user?.apellido}
                </p>
                <p className="text-xs text-secondary-600 truncate capitalize">
                  {user?.roles?.[0]?.nombre === 'administrador' && 'Administrador'}
                  {user?.roles?.[0]?.nombre === 'docente' && 'Docente'}
                  {user?.roles?.[0]?.nombre === 'estudiante' && 'Estudiante'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
