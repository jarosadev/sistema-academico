import React, { useState, useEffect } from 'react';
import { Plus, Search, Book, BookOpen, BookX, Edit, Trash2, Eye, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../../services/dataService';
import { useDebounce } from '../../hooks/useDebounce';
import { notificationService } from '../../services/notificationService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Table, { DataTable } from '../../components/ui/Table';
import Modal from '../../components/ui/ModalImproved';
import Loading from '../../components/ui/Loading';
import MateriaForm from '../../components/admin/MateriaForm';
import MateriaDetalle from '../../components/admin/MateriaDetalle';

const MateriasPage = () => {
  const navigate = useNavigate();
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMateria, setSelectedMateria] = useState(null);
  
  // Estados para filtros y paginación
  const [filtros, setFiltros] = useState({
    search: '',
    mencion: '',
    semestre: '',
    page: 1,
    limit: 10
  });

  // Estado separado para el input de búsqueda (sin debounce)
  const [searchInput, setSearchInput] = useState('');
  
  // Debounce para la búsqueda
  const debouncedSearch = useDebounce(searchInput, 500);
  
  const [paginacion, setPaginacion] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  
  const [estadisticas, setEstadisticas] = useState({
    total_materias: 0,
    activas: 0,
    inactivas: 0
  });

  const [menciones, setMenciones] = useState([]);

  // Cargar datos iniciales
  useEffect(() => {
    cargarMaterias();
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

  const cargarMaterias = async () => {
    try {
      setLoading(true);
      const response = await dataService.materias.obtenerTodas(filtros);
      setMaterias(response.data);
      setPaginacion(response.pagination);
    } catch (error) {
      notificationService.error('Error al cargar materias: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const response = await dataService.materias.obtenerEstadisticas();
      setEstadisticas(response.data.resumen);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      notificationService.error('Error al cargar estadísticas: ' + error.message);
    }
  };

  const cargarMenciones = async () => {
    try {
      const response = await dataService.menciones.obtenerTodas({ activo: true });
      setMenciones(response.data);
    } catch (error) {
      console.error('Error al cargar menciones:', error);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor,
      page: 1
    }));
  };

  const handlePageChange = (newPage) => {
    setFiltros(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const handleCrearMateria = async (data) => {
    let loadingToast = null;
    try {
      loadingToast = notificationService.loading('Creando materia...');
      await dataService.materias.crear(data);
      notificationService.success('Materia creada exitosamente');
      setShowCreateModal(false);
      cargarMaterias();
      cargarEstadisticas();
    } catch (error) {
      notificationService.error('Error al crear materia: ' + error.message);
    } finally {
      if (loadingToast) notificationService.dismissToast(loadingToast);
    }
  };

  const handleEditarMateria = async (data) => {
    let loadingToast = null;
    try {
      loadingToast = notificationService.loading('Actualizando materia...');
      await dataService.materias.actualizar(selectedMateria.id_materia, data);
      notificationService.success('Materia actualizada exitosamente');
      setShowEditModal(false);
      setSelectedMateria(null);
      cargarMaterias();
    } catch (error) {
      notificationService.error('Error al actualizar materia: ' + error.message);
    } finally {
      if (loadingToast) notificationService.dismissToast(loadingToast);
    }
  };

  const handleEliminarMateria = async (materia) => {
    const confirmed = await notificationService.confirmDelete(materia.nombre);
    if (confirmed) {
      let loadingToast = null;
      try {
        loadingToast = notificationService.loading('Eliminando materia...');
        await dataService.materias.eliminar(materia.id_materia);
        notificationService.success('Materia eliminada exitosamente');
        cargarMaterias();
        cargarEstadisticas();
      } catch (error) {
        notificationService.error('Error al eliminar materia: ' + error.message);
      } finally {
        if (loadingToast) notificationService.dismissToast(loadingToast);
      }
    }
  };

  const columnas = [
    {
      key: 'sigla',
      title: 'Sigla'
    },
    {
      key: 'nombre',
      title: 'Nombre'
    },
    {
      key: 'mencion_nombre',
      title: 'Mención'
    },
    {
      key: 'semestre',
      title: 'Semestre'
    },
    {
      key: 'activo',
      title: 'Estado',
      render: (materia) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          materia.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {materia.activo ? 'Activa' : 'Inactiva'}
        </span>
      )
    },
    {
      key: 'acciones',
      title: 'Acciones',
      render: (materia) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setSelectedMateria(materia);
              setShowDetailModal(true);
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setSelectedMateria(materia);
              setShowEditModal(true);
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate(`/materias/${materia.id_materia}/tipos-evaluacion`)}
            title="Gestionar tipos de evaluación"
          >
            <ClipboardList className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleEliminarMateria(materia)}
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
          <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900">Gestión de Materias</h1>
          <p className="text-secondary-600 mt-1">Administra las materias del sistema</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Materia
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <Book className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Total Materias</p>
              <p className="text-2xl font-bold text-secondary-900">{estadisticas.total_materias}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <BookOpen className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Activas</p>
              <p className="text-2xl font-bold text-secondary-900">{estadisticas.activas}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <BookX className="w-8 h-8 text-gray-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Inactivas</p>
              <p className="text-2xl font-bold text-secondary-900">{estadisticas.inactivas}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Input
              placeholder="Buscar por sigla o nombre..."
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
              value={filtros.semestre}
              onChange={(e) => handleFiltroChange('semestre', e.target.value)}
            >
              <option value="">Todos los semestres</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(sem => (
                <option key={sem} value={sem}>
                  Semestre {sem}
                </option>
              ))}
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
              data={materias}
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
        title="Crear Nueva Materia"
        size="xl"
      >
        <MateriaForm
          onSubmit={handleCrearMateria}
          onCancel={() => setShowCreateModal(false)}
          menciones={menciones}
        />
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedMateria(null);
        }}
        title="Editar Materia"
        size="xl"
      >
        {selectedMateria && (
          <MateriaForm
            materia={selectedMateria}
            onSubmit={handleEditarMateria}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedMateria(null);
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
          setSelectedMateria(null);
        }}
        title="Detalle de la Materia"
        size="xl"
      >
        {selectedMateria && (
          <MateriaDetalle
            materia={selectedMateria}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedMateria(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default MateriasPage;
