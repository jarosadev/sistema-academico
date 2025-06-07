import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  Award, 
  TrendingUp, 
  Calendar,
  FileText,
  BarChart
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useRoleCheck } from '../components/routing/RoleBasedRoute';
import { dataService } from '../services/dataService';
import Card from '../components/ui/Card';
import Loading from '../components/ui/Loading';
import Alert from '../components/ui/Alert';
import { helpers } from '../utils/helpers';

const DashboardPage = () => {
  const { user } = useAuth();
  const roleCheck = useRoleCheck();
  const { isAdmin, isTeacher, isStudent } = {
    isAdmin: roleCheck.isAdmin(),
    isTeacher: roleCheck.isTeacher(),
    isStudent: roleCheck.isStudent()
  };
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      let dashboardData = {};

      if (isAdmin) {
        // Cargar estadísticas para administrador
        const [auditoria, estudiantes, docentes, materias, inscripciones] = await Promise.all([
          dataService.auditoria.obtenerLogs({ limit: 5 }),
          dataService.estudiantes.obtenerEstadisticas(),
          dataService.docentes.obtenerEstadisticas(),
          dataService.materias.obtenerEstadisticas(),
          dataService.inscripciones.obtenerEstadisticas()
        ]);
        console.log(auditoria)
        // Map audit entries to activity objects with improved messages
        const filteredActividadReciente = (auditoria.data || [])
          .map(item => {
            let mensaje;
            if (item.accion === 'LOGIN') {
              mensaje = `Inicio de sesión: ${item.usuario_nombre || 'Usuario'}`;
            } else if (item.accion === 'LOGOUT') {
              mensaje = `Cierre de sesión: ${item.usuario_nombre || 'Usuario'}`;
            } else {
              mensaje = `${item.accion} en ${item.tabla_afectada}`;
            }
            return {
              id: item.id_auditoria,
              mensaje,
              fecha: item.fecha_accion,
              tipo: item.accion === 'LOGIN' || item.accion === 'LOGOUT' ? 'auth' : 'actividad'
            };
          });
        console.log('Filtered recent activity:', filteredActividadReciente);

        dashboardData = {
          totalEstudiantes: estudiantes.data?.resumen?.total_estudiantes || 0,
          estudiantesActivos: estudiantes.data?.resumen?.activos || 0,
          totalDocentes: docentes.data?.resumen?.total_docentes || 0,
          docentesActivos: docentes.data?.resumen?.activos || 0,
          totalMaterias: materias.data?.resumen?.total_materias || 0,
          materiasActivas: materias.data?.resumen?.activas || 0,
          totalInscripciones: inscripciones.data?.resumen?.total_inscripciones || 0,
          inscripcionesActivas: inscripciones.data?.resumen?.inscritos || 0,
          actividadReciente: filteredActividadReciente
        };
      } else if (isTeacher) {
        // Cargar datos para docente
        const [materias, estudiantes] = await Promise.all([
          dataService.docentes.obtenerMaterias(user.id_docente),
          dataService.docentes.obtenerEstudiantes(user.id_docente)
        ]);

        dashboardData = {
          misMaterias: materias.data?.length || 0,
          misEstudiantes: estudiantes.data?.length || 0,
          materiasActivas: materias.data?.filter(m => m.activa).length || 0
        };
      } else if (isStudent) {
        // Cargar datos para estudiante
        const [inscripciones, notas] = await Promise.all([
          dataService.inscripciones.obtenerPorEstudiante(user.id_estudiante),
          dataService.notas.obtenerPorEstudiante(user.id_estudiante)
        ]);

        const promedio = notas.data?.reduce((acc, nota) => acc + nota.calificacion, 0) / (notas.data?.length || 1);

        dashboardData = {
          misInscripciones: inscripciones.data?.length || 0,
          materiasAprobadas: notas.data?.filter(n => n.calificacion >= 51).length || 0,
          promedioGeneral: promedio || 0,
          materiasActuales: inscripciones.data?.filter(i => i.activa).length || 0
        };
      }

      setStats(dashboardData);
    } catch (error) {
      setError('Error al cargar los datos del dashboard');
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const getRoleDisplayName = () => {
    if (isAdmin) return 'Administrador';
    if (isTeacher) return 'Docente';
    if (isStudent) return 'Estudiante';
    return 'Usuario';
  };

  if (loading) {
    return <Loading fullScreen text="Cargando dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header de bienvenida */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {getGreeting()}, {isAdmin ? 'Administrador' : user?.nombre}!
            </h1>
            <p className="text-primary-100 mt-1">
              Bienvenido al Sistema Académico - {getRoleDisplayName()}
            </p>
          </div>
          <div className="hidden md:block">
            <div className="text-right">
              <p className="text-primary-100 text-sm">
                {helpers.formatDate(new Date(), 'long')}
              </p>
              <p className="text-primary-200 text-xs">
                Último acceso: {helpers.formatDateTime(user?.ultimo_acceso)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Estadísticas por rol */}
      {isAdmin && (
        <AdminDashboard stats={stats} />
      )}

      {isTeacher && (
        <TeacherDashboard stats={stats} user={user} />
      )}

      {isStudent && (
        <StudentDashboard stats={stats} user={user} />
      )}
    </div>
  );
};

// Dashboard para Administrador
const AdminDashboard = ({ stats }) => {
  const navigate = useNavigate();

  const formatearTiempoRelativo = (fecha) => {
    const ahora = new Date();
    const diferencia = ahora - fecha;
    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

    if (minutos < 60) {
      return `hace ${minutos} minuto${minutos !== 1 ? 's' : ''}`;
    } else if (horas < 24) {
      return `hace ${horas} hora${horas !== 1 ? 's' : ''}`;
    } else {
      return `hace ${dias} día${dias !== 1 ? 's' : ''}`;
    }
  };

  const statsCards = [
    {
      title: 'Estudiantes',
      value: stats.totalEstudiantes,
      subtitle: `${stats.estudiantesActivos} activos`,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Docentes',
      value: stats.totalDocentes,
      subtitle: `${stats.docentesActivos} activos`,
      icon: GraduationCap,
      color: 'bg-green-500'
    },
    {
      title: 'Materias',
      value: stats.totalMaterias,
      subtitle: `${stats.materiasActivas} activas`,
      icon: BookOpen,
      color: 'bg-purple-500'
    },
    {
      title: 'Inscripciones',
      value: stats.totalInscripciones,
      subtitle: `${stats.inscripcionesActivas} activas`,
      icon: FileText,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index}>
            <Card.Content className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {stat.value}
                  </p>
                  <p className="text-xs text-secondary-500 mt-1">
                    {stat.subtitle}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card.Content>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Card.Header className="flex justify-between items-center">
            <Card.Title>
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-primary-500" />
                <span>Actividad Reciente</span>
              </div>
            </Card.Title>
            <span className="text-xs text-secondary-500">
              Últimas {stats.actividadReciente?.length || 0} actividades
            </span>
          </Card.Header>
          <Card.Content className="p-0">
            <div className="divide-y divide-secondary-100">
              {stats.actividadReciente && stats.actividadReciente.length > 0 ? (
                stats.actividadReciente.map((actividad, index) => (
                  <div 
                    key={actividad.id ?? index} 
                    className="flex items-center p-4 hover:bg-secondary-50 transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      actividad.tipo === 'estudiante' ? 'bg-blue-500' :
                      actividad.tipo === 'materia' ? 'bg-green-500' :
                      actividad.tipo === 'inscripcion' ? 'bg-purple-500' :
                      actividad.tipo === 'auth' ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }`}></div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-secondary-900">
                          {actividad.mensaje}
                        </p>
                        <span className="text-xs text-secondary-500 whitespace-nowrap ml-4">
                          {helpers.formatDateTime(actividad.fecha)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <p className="text-sm text-secondary-600">
                    No hay actividad reciente registrada
                  </p>
                </div>
              )}
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header className="flex justify-between items-center">
            <Card.Title>
              <div className="flex items-center space-x-2">
                <BarChart className="w-5 h-5 text-primary-500" />
                <span>Acciones Rápidas</span>
              </div>
            </Card.Title>
          </Card.Header>
          <Card.Content className="p-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  title: 'Gestionar Estudiantes',
                  icon: Users,
                  color: 'blue',
                  path: '/estudiantes'
                },
                {
                  title: 'Gestionar Materias',
                  icon: BookOpen,
                  color: 'green',
                  path: '/materias'
                },
                {
                  title: 'Ver Reportes',
                  icon: BarChart,
                  color: 'purple',
                  path: '/reportes'
                },
                {
                  title: 'Gestionar Inscripciones',
                  icon: FileText,
                  color: 'orange',
                  path: '/inscripciones'
                }
              ].map((action, index) => (
                <button 
                  key={index}
                  onClick={() => navigate(action.path)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl shadow-sm border focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-${
                    action.color === 'blue' ? 'blue' :
                    action.color === 'green' ? 'green' :
                    action.color === 'purple' ? 'purple' :
                    'orange'
                  }-500 active:scale-95 ${
                    action.color === 'blue' ? 'bg-blue-50 hover:bg-blue-100 border-blue-200' :
                    action.color === 'green' ? 'bg-green-50 hover:bg-green-100 border-green-200' :
                    action.color === 'purple' ? 'bg-purple-50 hover:bg-purple-100 border-purple-200' :
                    'bg-orange-50 hover:bg-orange-100 border-orange-200'
                  } transition-all duration-200 group`}
                >
                  <div className={`p-3 rounded-lg mb-3 ${
                    action.color === 'blue' ? 'bg-blue-100 group-hover:bg-blue-200' :
                    action.color === 'green' ? 'bg-green-100 group-hover:bg-green-200' :
                    action.color === 'purple' ? 'bg-purple-100 group-hover:bg-purple-200' :
                    'bg-orange-100 group-hover:bg-orange-200'
                  }`}>
                    <action.icon className={`w-6 h-6 ${
                      action.color === 'blue' ? 'text-blue-600' :
                      action.color === 'green' ? 'text-green-600' :
                      action.color === 'purple' ? 'text-purple-600' :
                      'text-orange-600'
                    }`} />
                  </div>
                  <p className={`text-sm font-medium text-center ${
                    action.color === 'blue' ? 'text-blue-700' :
                    action.color === 'green' ? 'text-green-700' :
                    action.color === 'purple' ? 'text-purple-700' :
                    'text-orange-700'
                  }`}>
                    {action.title}
                  </p>
                </button>
              ))}
            </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
};

// Dashboard para Docente
const TeacherDashboard = ({ stats, user }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Mis Materias</p>
                <p className="text-2xl font-bold text-secondary-900">{stats.misMaterias}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Mis Estudiantes</p>
                <p className="text-2xl font-bold text-secondary-900">{stats.misEstudiantes}</p>
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Materias Activas</p>
                <p className="text-2xl font-bold text-secondary-900">{stats.materiasActivas}</p>
              </div>
              <Award className="w-8 h-8 text-purple-500" />
            </div>
          </Card.Content>
        </Card>
      </div>

      <Card>
        <Card.Header>
          <Card.Title>Tareas Pendientes</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm">Calificar exámenes de Cálculo I</span>
              <span className="text-xs text-yellow-600 bg-yellow-200 px-2 py-1 rounded">Pendiente</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm">Subir material de Álgebra Linear</span>
              <span className="text-xs text-blue-600 bg-blue-200 px-2 py-1 rounded">En progreso</span>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

// Dashboard para Estudiante
const StudentDashboard = ({ stats, user }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Mis Materias</p>
                <p className="text-2xl font-bold text-secondary-900">{stats.materiasActuales}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Aprobadas</p>
                <p className="text-2xl font-bold text-secondary-900">{stats.materiasAprobadas}</p>
              </div>
              <Award className="w-8 h-8 text-green-500" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Promedio</p>
                <p className="text-2xl font-bold text-secondary-900">
                  {helpers.formatGrade(stats.promedioGeneral)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Inscripciones</p>
                <p className="text-2xl font-bold text-secondary-900">{stats.misInscripciones}</p>
              </div>
              <FileText className="w-8 h-8 text-orange-500" />
            </div>
          </Card.Content>
        </Card>
      </div>

      <Card>
        <Card.Header>
          <Card.Title>Próximos Exámenes</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div>
                <span className="text-sm font-medium">Cálculo I - Primer Parcial</span>
                <p className="text-xs text-secondary-600">Aula 101</p>
              </div>
              <span className="text-xs text-red-600">15 Nov, 8:00 AM</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div>
                <span className="text-sm font-medium">Física I - Laboratorio</span>
                <p className="text-xs text-secondary-600">Lab. Física</p>
              </div>
              <span className="text-xs text-orange-600">18 Nov, 2:00 PM</span>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default DashboardPage;
