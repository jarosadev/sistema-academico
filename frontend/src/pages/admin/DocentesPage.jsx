import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Eye, Users, UserCheck, UserX, BookOpen } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { useDebounce } from '../../hooks/useDebounce';
import { notificationService } from '../../services/notificationService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Table, { DataTable } from '../../components/ui/Table';
import Modal from '../../components/ui/ModalImproved';
import Loading from '../../components/ui/Loading';
import DocenteForm from '../../components/admin/DocenteForm';
import DocenteDetalle from '../../components/admin/DocenteDetalle';

const DocentesPage = () => {
  const [docentes, setDocentes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDocente, setSelectedDocente] = useState(null);
  
  // Estados para filtros y paginación
  const [filtros, setFiltros] = useState({
    search: '',
    especialidad: '',
    activo: '',
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
    total_docentes: 0,
    activos: 0,
    inactivos: 0
  });

  const [especialidades, setEspecialidades] = useState([]);

  // Cargar datos iniciales
  useEffect(() => {
    cargarDocentes();
    cargarEstadisticas();
    cargarEspecialidades();
  }, [filtros]);

  // Efecto para actualizar filtros cuando cambie el debounced search
  useEffect(() => {
    setFiltros(prev => ({
      ...prev,
      search: debouncedSearch,
      page: 1
    }));
  }, [debouncedSearch]);

  const cargarDocentes = async () => {
    try {
      setLoading(true);
      const response = await dataService.docentes.getAll(filtros);
      setDocentes(response.data);
      setPaginacion(response.pagination);
    } catch (error) {
      notificationService.error('Error al cargar docentes: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const response = await dataService.docentes.getEstadisticas();
      setEstadisticas(response.data.resumen);
      
      // Extraer especialidades únicas
      if (response.data.por_especialidad) {
        const especialidadesUnicas = response.data.por_especialidad.map(item => item.especialidad);
        setEspecialidades(especialidadesUnicas);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const cargarEspecialidades = async () => {
    try {
      // Si no tenemos especialidades de las estadísticas, cargar docentes para extraerlas
      if (especialidades.length === 0) {
        const response = await dataService.docentes.getAll({ limit: 100 });
        const especialidadesUnicas = [...new Set(
          response.data
            .map(docente => docente.especialidad)
            .filter(esp => esp && esp.trim() !== '')
        )];
        setEspecialidades(especialidadesUnicas);
      }
    } catch (error) {
      console.error('Error al cargar especialidades:', error);
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

  const handleCrearDocente = async (data) => {
    const loadingToast = notificationService.loading('Creando docente...');
    try {
      await dataService.docentes.create(data);
      notificationService.dismissToast(loadingToast);
      notificationService.success('Docente creado exitosamente');
      setShowCreateModal(false);
      cargarDocentes();
      cargarEstadisticas();
    } catch (error) {
      notificationService.dismissToast(loadingToast);
      notificationService.error('Error al crear docente: ' + error.message);
    }
  };

  const handleEditarDocente = async (data) => {
    const loadingToast = notificationService.loading('Actualizando docente...');
    try {
      await dataService.docentes.update(selectedDocente.id_docente, data);
      notificationService.dismissToast(loadingToast);
      notificationService.success('Docente actualizado exitosamente');
      setShowEditModal(false);
      setSelectedDocente(null);
      cargarDocentes();
    } catch (error) {
      notificationService.dismissToast(loadingToast);
      notificationService.error('Error al actualizar docente: ' + error.message);
    }
  };

  const handleEliminarDocente = async (docente) => {
    const confirmed = await notificationService.confirmDelete(`${docente.nombre} ${docente.apellido}`);
    if (confirmed) {
      const loadingToast = notificationService.loading('Eliminando docente...');
      try {
        await dataService.docentes.delete(docente.id_docente);
        notificationService.dismissToast(loadingToast);
        notificationService.success('Docente eliminado exitosamente');
        cargarDocentes();
        cargarEstadisticas();
      } catch (error) {
        notificationService.dismissToast(loadingToast);
        notificationService.error('Error al eliminar docente: ' + error.message);
      }
    }
  };

  const handleAsignarMateria = async (docenteId, materiaData) => {
    const loadingToast = notificationService.loading('Asignando materia...');
    try {
      await dataService.docentes.asignarMateria(docenteId, materiaData);
      notificationService.dismissToast(loadingToast);
      notificationService.success('Materia asignada exitosamente');
      cargarDocentes();
    } catch (error) {
      notificationService.dismissToast(loadingToast);
      notificationService.error('Error al asignar materia: ' + error.message);
    }
  };

  const columnas = [
    {
      key: 'nombre_completo',
      title: 'Nombre Completo',
      render: (docente) => `${docente.nombre} ${docente.apellido}`
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
      key: 'especialidad',
      title: 'Especialidad'
    },
    {
      key: 'materias_asignadas',
      title: 'Materias',
      render: (docente) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
          {docente.materias_asignadas || 0}
        </span>
      )
    },
    {
      key: 'activo',
      title: 'Estado',
      render: (docente) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          docente.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {docente.activo ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
    {
      key: 'acciones',
      title: 'Acciones',
      render: (docente) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setSelectedDocente(docente);
              setShowDetailModal(true);
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setSelectedDocente(docente);
              setShowEditModal(true);
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleEliminarDocente(docente)}
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
          <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900">Gestión de Docentes</h1>
          <p className="text-secondary-600 mt-1">Administra los docentes del sistema</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Docente
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Total Docentes</p>
              <p className="text-2xl font-bold text-secondary-900">{estadisticas.total_docentes}</p>
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
            <UserX className="w-8 h-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Inactivos</p>
              <p className="text-2xl font-bold text-secondary-900">{estadisticas.inactivos}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <BookOpen className="w-8 h-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Especialidades</p>
              <p className="text-2xl font-bold text-secondary-900">{especialidades.length}</p>
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
              value={filtros.especialidad}
              onChange={(e) => handleFiltroChange('especialidad', e.target.value)}
            >
              <option value="">Todas las especialidades</option>
              {especialidades.map(especialidad => (
                <option key={especialidad} value={especialidad}>
                  {especialidad}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              className="w-full h-12 px-4 py-3 text-base border border-secondary-300 bg-white text-secondary-900 placeholder-secondary-400 rounded-lg focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500/20 transition-colors duration-200"
              value={filtros.activo}
              onChange={(e) => handleFiltroChange('activo', e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
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
              data={docentes}
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
        title="Crear Nuevo Docente"
        size="xl"
      >
        <DocenteForm
          onSubmit={handleCrearDocente}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedDocente(null);
        }}
        title="Editar Docente"
        size="xl"
      >
        {selectedDocente && (
          <DocenteForm
            docente={selectedDocente}
            onSubmit={handleEditarDocente}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedDocente(null);
            }}
            isEdit={true}
          />
        )}
      </Modal>

      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedDocente(null);
        }}
        title="Detalle del Docente"
        size="xl"
      >
        {selectedDocente && (
          <DocenteDetalle
            docente={selectedDocente}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedDocente(null);
            }}
            onAsignarMateria={handleAsignarMateria}
          />
        )}
      </Modal>
    </div>
  );
};

export default DocentesPage;
