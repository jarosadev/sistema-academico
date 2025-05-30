import React, { useState, useEffect } from 'react';
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
        const [estudiantes, docentes, materias, inscripciones] = await Promise.all([
          dataService.estudiantes.obtenerEstadisticas(),
          dataService.docentes.obtenerEstadisticas(),
          dataService.materias.obtenerEstadisticas(),
          dataService.inscripciones.obtenerEstadisticas()
        ]);

        dashboardData = {
          totalEstudiantes: estudiantes.data?.total || 0,
          estudiantesActivos: estudiantes.data?.activos || 0,
          totalDocentes: docentes.data?.total || 0,
          docentesActivos: docentes.data?.activos || 0,
          totalMaterias: materias.data?.total || 0,
          materiasActivas: materias.data?.activas || 0,
          totalInscripciones: inscripciones.data?.total || 0,
          inscripcionesActivas: inscripciones.data?.activas || 0
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
              {getGreeting()}, {user?.nombre}!
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
  const statsCards = [
    {
      title: 'Estudiantes',
      value: stats.totalEstudiantes,
      subtitle: `${stats.estudiantesActivos} activos`,
      icon: Users,
      color: 'bg-blue-500',
      trend: '+12%'
    },
    {
      title: 'Docentes',
      value: stats.totalDocentes,
      subtitle: `${stats.docentesActivos} activos`,
      icon: GraduationCap,
      color: 'bg-green-500',
      trend: '+5%'
    },
    {
      title: 'Materias',
      value: stats.totalMaterias,
      subtitle: `${stats.materiasActivas} activas`,
      icon: BookOpen,
      color: 'bg-purple-500',
      trend: '+8%'
    },
    {
      title: 'Inscripciones',
      value: stats.totalInscripciones,
      subtitle: `${stats.inscripcionesActivas} activas`,
      icon: FileText,
      color: 'bg-orange-500',
      trend: '+15%'
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
              <div className="mt-4 flex items-center">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">{stat.trend}</span>
                <span className="text-sm text-secondary-500 ml-1">vs mes anterior</span>
              </div>
            </Card.Content>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <Card.Title>Actividad Reciente</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <p className="text-sm text-secondary-600">
                  Nuevo estudiante registrado - Juan Pérez
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-sm text-secondary-600">
                  Materia "Cálculo I" actualizada
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <p className="text-sm text-secondary-600">
                  Reporte mensual generado
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Acciones Rápidas</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 border border-secondary-200 rounded-lg hover:bg-secondary-50 text-left">
                <Users className="w-6 h-6 text-blue-500 mb-2" />
                <p className="text-sm font-medium">Gestionar Estudiantes</p>
              </button>
              <button className="p-4 border border-secondary-200 rounded-lg hover:bg-secondary-50 text-left">
                <BookOpen className="w-6 h-6 text-green-500 mb-2" />
                <p className="text-sm font-medium">Gestionar Materias</p>
              </button>
              <button className="p-4 border border-secondary-200 rounded-lg hover:bg-secondary-50 text-left">
                <BarChart className="w-6 h-6 text-purple-500 mb-2" />
                <p className="text-sm font-medium">Ver Reportes</p>
              </button>
              <button className="p-4 border border-secondary-200 rounded-lg hover:bg-secondary-50 text-left">
                <Calendar className="w-6 h-6 text-orange-500 mb-2" />
                <p className="text-sm font-medium">Programar Eventos</p>
              </button>
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
