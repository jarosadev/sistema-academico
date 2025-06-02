import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Eye, Users, UserCheck, UserX, GraduationCap } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { useDebounce } from '../../hooks/useDebounce';
import { notificationService } from '../../services/notificationService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Table, { DataTable } from '../../components/ui/Table';
import Modal from '../../components/ui/ModalImproved';
import Loading from '../../components/ui/Loading';
import EstudianteForm from '../../components/admin/EstudianteForm';
import EstudianteDetalle from '../../components/admin/EstudianteDetalle';

const EstudiantesPage = () => {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEstudiante, setSelectedEstudiante] = useState(null);
  
  // Estados para filtros y paginación
  const [filtros, setFiltros] = useState({
    search: '',
    mencion: '',
    estado: '',
    page: 1,
    limit: 10
  });

  // Estado separado para el input de búsqueda (sin debounce)
  const [searchInput, setSearchInput] = useState('');
  
  // Debounce para la búsqueda
  const debouncedSearch = useDebounce(searchInput, 500);
  
  const [paginacion, setPaginacion] = useState({
    page: 1,
    limit: 4,
    total: 0,
    totalPages: 0
  });
  
  const [estadisticas, setEstadisticas] = useState({
    total_estudiantes: 0,
    activos: 0,
    inactivos: 0,
    graduados: 0,
    suspendidos: 0
  });

  const [menciones, setMenciones] = useState([]);

  // Cargar datos iniciales
  useEffect(() => {
    cargarEstudiantes();
    cargarEstadisticas();
    cargarMenciones();
  }, [filtros]);

  // Efecto para actualizar filtros cuando cambie el debounced search
  useEffect(() => {
    setFiltros(prev => ({
      ...prev,
      search: debouncedSearch,
      page: 1
    }));
  }, [debouncedSearch]);

  const cargarEstudiantes = async () => {
    try {
      setLoading(true);
      const response = await dataService.estudiantes.getAll(filtros);
      setEstudiantes(response.data);
      setPaginacion(response.pagination);
    } catch (error) {
      if (!window.__isSessionExpired) {
        notificationService.error('Error al cargar estudiantes: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const response = await dataService.estudiantes.getEstadisticas();
      setEstadisticas(response.data.resumen);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const cargarMenciones = async () => {
    try {
      const response = await dataService.menciones.getAll({ activo: true });
      setMenciones(response.data);
    } catch (error) {
      console.error('Error al cargar menciones:', error);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor,
      page: 1 // Resetear a primera página
    }));
  };

  const handlePageChange = (newPage) => {
    setFiltros(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const handleCrearEstudiante = async (data) => {
    let loadingToast = null;
    try {
      loadingToast = notificationService.loading('Creando estudiante...');
      await dataService.estudiantes.create(data);
      notificationService.success('Estudiante creado exitosamente');
      setShowCreateModal(false);
      cargarEstudiantes();
      cargarEstadisticas();
    } catch (error) {
      if (!window.__isSessionExpired) {
        notificationService.error('Error al crear estudiante: ' + error.message);
      }
    } finally {
      if (loadingToast) notificationService.dismissToast(loadingToast);
    }
  };

  const handleEditarEstudiante = async (data) => {
    let loadingToast = null;
    try {
      loadingToast = notificationService.loading('Actualizando estudiante...');
      await dataService.estudiantes.update(selectedEstudiante.id_estudiante, data);
      notificationService.success('Estudiante actualizado exitosamente');
      setShowEditModal(false);
      setSelectedEstudiante(null);
      cargarEstudiantes();
    } catch (error) {
      if (!window.__isSessionExpired) {
        notificationService.error('Error al actualizar estudiante: ' + error.message);
      }
    } finally {
      if (loadingToast) notificationService.dismissToast(loadingToast);
    }
  };

  const handleEliminarEstudiante = async (estudiante) => {
    const confirmed = await notificationService.confirmDelete(`${estudiante.nombre} ${estudiante.apellido}`);
    if (confirmed) {
      let loadingToast = null;
      try {
        loadingToast = notificationService.loading('Eliminando estudiante...');
        await dataService.estudiantes.delete(estudiante.id_estudiante);
        notificationService.success('Estudiante eliminado exitosamente');
        cargarEstudiantes();
        cargarEstadisticas();
      } catch (error) {
        if (!window.__isSessionExpired) {
          notificationService.error('Error al eliminar estudiante: ' + error.message);
        }
      } finally {
        if (loadingToast) notificationService.dismissToast(loadingToast);
      }
    }
  };

  const handleCambiarEstado = async (estudiante, nuevoEstado) => {
    const confirmed = await notificationService.confirm({
      title: 'Cambiar estado del estudiante',
      text: `¿Está seguro de cambiar el estado de ${estudiante.nombre} ${estudiante.apellido} a ${nuevoEstado}?`,
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'Cancelar'
    });

    if (confirmed) {
      let loadingToast = null;
      try {
        loadingToast = notificationService.loading('Cambiando estado...');
        await dataService.estudiantes.cambiarEstado(estudiante.id_estudiante, nuevoEstado);
        notificationService.success(`Estado del estudiante cambiado a ${nuevoEstado}`);
        cargarEstudiantes();
        cargarEstadisticas();
      } catch (error) {
        if (!window.__isSessionExpired) {
          notificationService.error('Error al cambiar estado: ' + error.message);
        }
      } finally {
        if (loadingToast) notificationService.dismissToast(loadingToast);
      }
    }
  };

  const columnas = [
    {
      key: 'nombre_completo',
      title: 'Nombre Completo',
      render: (estudiante) => `${estudiante.nombre} ${estudiante.apellido}`
    },
    {
      key: 'ci',
      title: 'CI'
    },
    {
      key: 'correo',
      title: 'Correo'
    },
    {
      key: 'mencion_nombre',
      title: 'Mención'
    },
    {
      key: 'estado_academico',
      title: 'Estado',
      render: (estudiante) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          estudiante.estado_academico === 'activo' ? 'bg-green-100 text-green-800' :
          estudiante.estado_academico === 'graduado' ? 'bg-blue-100 text-blue-800' :
          estudiante.estado_academico === 'suspendido' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {estudiante.estado_academico}
        </span>
      )
    },
    {
      key: 'acciones',
      title: 'Acciones',
      render: (estudiante) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setSelectedEstudiante(estudiante);
              setShowDetailModal(true);
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setSelectedEstudiante(estudiante);
              setShowEditModal(true);
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleEliminarEstudiante(estudiante)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900">Gestión de Estudiantes</h1>
          <p className="text-secondary-600 mt-1">Administra los estudiantes del sistema</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Estudiante
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Total</p>
              <p className="text-2xl font-bold text-secondary-900">{estadisticas.total_estudiantes}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <UserCheck className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Activos</p>
              <p className="text-2xl font-bold text-secondary-900">{estadisticas.activos}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <GraduationCap className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Graduados</p>
              <p className="text-2xl font-bold text-secondary-900">{estadisticas.graduados}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <UserX className="w-8 h-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Suspendidos</p>
              <p className="text-2xl font-bold text-secondary-900">{estadisticas.suspendidos}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <UserX className="w-8 h-8 text-gray-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Inactivos</p>
              <p className="text-2xl font-bold text-secondary-900">{estadisticas.inactivos}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Input
              placeholder="Buscar por nombre, apellido o CI..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              icon={<Search className="w-4 h-4" />}
              size="md"
            />
          </div>
          <div>
            <select
              className="w-full h-12 px-4 py-3 text-base border border-secondary-300 bg-white text-secondary-900 placeholder-secondary-400 rounded-lg focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500/20 transition-colors duration-200"
              value={filtros.mencion}
              onChange={(e) => handleFiltroChange('mencion', e.target.value)}
            >
              <option value="">Todas las menciones</option>
              {menciones.map(mencion => (
                <option key={mencion.id_mencion} value={mencion.id_mencion}>
                  {mencion.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              className="w-full h-12 px-4 py-3 text-base border border-secondary-300 bg-white text-secondary-900 placeholder-secondary-400 rounded-lg focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500/20 transition-colors duration-200"
              value={filtros.estado}
              onChange={(e) => handleFiltroChange('estado', e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="graduado">Graduado</option>
              <option value="suspendido">Suspendido</option>
            </select>
          </div>
          <div>
            <select
              className="w-full h-12 px-4 py-3 text-base border border-secondary-300 bg-white text-secondary-900 placeholder-secondary-400 rounded-lg focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500/20 transition-colors duration-200"
              value={filtros.limit}
              onChange={(e) => handleFiltroChange('limit', parseInt(e.target.value))}
            >
              <option value={10}>10 por página</option>
              <option value={25}>25 por página</option>
              <option value={50}>50 por página</option>
              <option value={100}>100 por página</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Tabla */}
      <Card className="p-4">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loading />
          </div>
        ) : (
          <>
            <DataTable
              data={estudiantes}
              columns={columnas}
              loading={loading}
              onRowClick={null}
              responsive={true}
            />
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t border-secondary-200">
              <Button
                variant="secondary"
                disabled={paginacion.page <= 1}
                onClick={() => handlePageChange(paginacion.page - 1)}
                className="w-full sm:w-auto"
              >
                Anterior
              </Button>
              <span className="text-sm sm:text-base font-medium text-secondary-700 order-first sm:order-none">
                Página {paginacion.page} de {paginacion.totalPages}
              </span>
              <Button
                variant="secondary"
                disabled={paginacion.page >= paginacion.totalPages}
                onClick={() => handlePageChange(paginacion.page + 1)}
                className="w-full sm:w-auto"
              >
                Siguiente
              </Button>
            </div>
          </>
        )}
      </Card>

      {/* Modales */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Crear Nuevo Estudiante"
        size="xl"
      >
        <EstudianteForm
          onSubmit={handleCrearEstudiante}
          onCancel={() => setShowCreateModal(false)}
          menciones={menciones}
        />
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedEstudiante(null);
        }}
        title="Editar Estudiante"
        size="xl"
      >
        {selectedEstudiante && (
          <EstudianteForm
            estudiante={selectedEstudiante}
            onSubmit={handleEditarEstudiante}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedEstudiante(null);
            }}
            menciones={menciones}
            isEdit={true}
          />
        )}
      </Modal>

      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedEstudiante(null);
        }}
        title="Detalle del Estudiante"
        size="xl"
      >
        {selectedEstudiante && (
          <EstudianteDetalle
            estudiante={selectedEstudiante}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedEstudiante(null);
            }}
            onCambiarEstado={handleCambiarEstado}
          />
        )}
      </Modal>
    </div>
  );
};

export default EstudiantesPage;
