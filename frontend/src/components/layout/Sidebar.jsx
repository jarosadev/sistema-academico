import  { useState, useEffect} from 'react';
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
  Database,
  Lock,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState({});
  const [initialized, setInitialized] = useState(false);

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

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
      // Grupo de Usuarios
      items.push({
        name: 'Usuarios',
        icon: Users,
        roles: ['administrador'],
        isGroup: true,
        children: [
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
          }
        ]
      });

      // Grupo de Académico
      items.push({
        name: 'Académico',
        icon: BookOpen,
        roles: ['administrador'],
        isGroup: true,
        children: [
          {
            name: 'Materias',
            href: '/materias',
            icon: BookOpen,
            roles: ['administrador']
          },
          {
            name: 'Cierre de Materias',
            href: '/cierre-materias',
            icon: Lock,
            roles: ['administrador']
          },
          {
            name: 'Menciones',
            href: '/menciones',
            icon: GraduationCap,
            roles: ['administrador']
          }
        ]
      });

      // Grupo de Gestión Académica
      items.push({
        name: 'Gestión Académica',
        icon: ClipboardList,
        roles: ['administrador'],
        isGroup: true,
        children: [
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
          }
        ]
      });

      // Grupo de Sistema
      items.push({
        name: 'Sistema',
        icon: Shield,
        roles: ['administrador'],
        isGroup: true,
        children: [
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
        ]
      });
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
    // Exact match for dashboard and settings
    if (href === '/dashboard' || href === '/settings') {
      return location.pathname === href;
    }
    
    // For other routes, check if the current path starts with the href
    // This will match both exact and nested routes (e.g. /materias and /materias/123)
    return href !== '/' && location.pathname.startsWith(href);
  };

  const isGroupActive = (group) => {
    if (!group.children) return false;
    return group.children.some(child => child.href && isActiveLink(child.href));
  };

  // Initialize expanded groups based on active items
  useEffect(() => {
    if (!initialized) {
      const initialExpanded = {};
      navigationItems.forEach(item => {
        if (item.isGroup && isGroupActive(item)) {
          initialExpanded[item.name] = true;
        }
      });
      setExpandedGroups(initialExpanded);
      setInitialized(true);
    }
  }, [navigationItems, initialized, location.pathname]);

  // Update expanded groups when location changes
  useEffect(() => {
    if (initialized) {
      const updatedExpanded = {};
      navigationItems.forEach(item => {
        if (item.isGroup) {
          if (isGroupActive(item)) {
            updatedExpanded[item.name] = true;
          } else if (expandedGroups[item.name] === true) {
            updatedExpanded[item.name] = true;
          }
        }
      });
      setExpandedGroups(updatedExpanded);
    }
  }, [location.pathname]);

  const renderMenuItem = (item) => {
    const Icon = item.icon;
    const isActive = item.href ? isActiveLink(item.href) : false;

    if (item.isGroup) {
      const isExpanded = expandedGroups[item.name] === true;
      const groupActive = isGroupActive(item);

      return (
        <div key={item.name} className="mb-2">
          <button
            onClick={() => toggleGroup(item.name)}
            className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              groupActive
                ? 'bg-primary-50 text-primary-700'
                : 'text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900'
            }`}
          >
            <div className="flex items-center">
              <Icon className={`w-5 h-5 mr-3 flex-shrink-0 ${groupActive ? 'text-primary-600' : 'text-secondary-500'}`} />
              <span className="truncate">{item.name}</span>
            </div>
            <ChevronRight className={`w-4 h-4 text-secondary-400 transition-transform duration-200 ${
              isExpanded ? 'transform -rotate-90' : 'transform rotate-90'
            }`} />
          </button>
          <div className={`overflow-hidden transition-all duration-200 ease-in-out ${
            isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="mt-1 ml-4 space-y-1 pb-1">
              {item.children.map(child => renderMenuItem(child))}
            </div>
          </div>
        </div>
      );
    }

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
            {navigationItems.map((item) => renderMenuItem(item))}
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
