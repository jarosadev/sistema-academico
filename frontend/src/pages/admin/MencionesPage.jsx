import React, { useState, useEffect } from 'react';
import { Plus, Search, GraduationCap, Users, BookOpen, Edit, Trash2, Eye } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { useDebounce } from '../../hooks/useDebounce';
import { notificationService } from '../../services/notificationService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Table, { DataTable } from '../../components/ui/Table';
import Modal from '../../components/ui/ModalImproved';
import Loading from '../../components/ui/Loading';
import MencionForm from '../../components/admin/MencionForm';
import MencionDetalle from '../../components/admin/MencionDetalle';

const MencionesPage = () => {
  const [menciones, setMenciones] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMencion, setSelectedMencion] = useState(null);
  
  // Estado separado para el input de búsqueda (sin debounce)
  const [searchInput, setSearchInput] = useState('');
  
  // Debounce para la búsqueda
  const debouncedSearch = useDebounce(searchInput, 500);
  
  const [paginacion, setPaginacion] = useState({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0
  });

  // Estados para filtros usando paginación
  const [filtros, setFiltros] = useState({
    search: '',
    activo: '',
    page: paginacion.page,
    limit: paginacion.limit
  });
  
  const [estadisticas, setEstadisticas] = useState({
    total_menciones: 0,
    activas: 0,
    inactivas: 0
  });

  // Cargar datos iniciales
  useEffect(() => {
    cargarMenciones();
    cargarEstadisticas();
  }, [filtros]);

  // Efecto para actualizar filtros cuando cambie el debounced search
  useEffect(() => {
    setFiltros(prev => ({
      ...prev,
      search: debouncedSearch,
      page: 1
    }));
  }, [debouncedSearch]);

  const cargarMenciones = async () => {
    try {
      setLoading(true);
      const response = await dataService.menciones.obtenerTodas(filtros);
      setMenciones(response.data);
      setPaginacion({
        ...response.pagination,
        totalPages: response.pagination.pages // Map backend 'pages' to frontend 'totalPages'
      });
      console.log(response)
    } catch (error) {
      notificationService.error('Error al cargar menciones: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const response = await dataService.menciones.obtenerEstadisticas();
      setEstadisticas(response.data.resumen);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
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
    setPaginacion(prev => ({
      ...prev,
      page: newPage
    }));
    setFiltros(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const handleCrearMencion = async (data) => {
    let loadingToast = null;
    try {
      loadingToast = notificationService.loading('Creando mención...');
      await dataService.menciones.crear(data);
      notificationService.success('Mención creada exitosamente');
      setShowCreateModal(false);
      cargarMenciones();
      cargarEstadisticas();
    } catch (error) {
      notificationService.error('Error al crear mención: ' + error.message);
    } finally {
      if (loadingToast) notificationService.dismissToast(loadingToast);
    }
  };

  const handleEditarMencion = async (data) => {
    let loadingToast = null;
    try {
      loadingToast = notificationService.loading('Actualizando mención...');
      await dataService.menciones.actualizar(selectedMencion.id_mencion, data);
      notificationService.success('Mención actualizada exitosamente');
      setShowEditModal(false);
      setSelectedMencion(null);
      cargarMenciones();
    } catch (error) {
      notificationService.error('Error al actualizar mención: ' + error.message);
    } finally {
      if (loadingToast) notificationService.dismissToast(loadingToast);
    }
  };

  const handleEliminarMencion = async (mencion) => {
    const confirmed = await notificationService.confirmDelete(mencion.nombre);
    if (confirmed) {
      let loadingToast = null;
      try {
        loadingToast = notificationService.loading('Eliminando mención...');
        await dataService.menciones.eliminar(mencion.id_mencion);
        notificationService.success('Mención eliminada exitosamente');
        cargarMenciones();
        cargarEstadisticas();
      } catch (error) {
        notificationService.error('Error al eliminar mención: ' + error.message);
      } finally {
        if (loadingToast) notificationService.dismissToast(loadingToast);
      }
    }
  };

  const columnas = [
    {
      key: 'nombre',
      title: 'Nombre'
    },
    {
      key: 'activo',
      title: 'Estado',
      render: (mencion) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          mencion.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {mencion.activo ? 'Activa' : 'Inactiva'}
        </span>
      )
    },
    {
      key: 'acciones',
      title: 'Acciones',
      render: (mencion) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setSelectedMencion(mencion);
              setShowDetailModal(true);
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setSelectedMencion(mencion);
              setShowEditModal(true);
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleEliminarMencion(mencion)}
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
          <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900">Gestión de Menciones</h1>
          <p className="text-secondary-600 mt-1">Administra las menciones o especializaciones del sistema</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Mención
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <GraduationCap className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Total Menciones</p>
              <p className="text-2xl font-bold text-secondary-900">{estadisticas.total_menciones}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Menciones Activas</p>
              <p className="text-2xl font-bold text-secondary-900">{estadisticas.activas}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <BookOpen className="w-8 h-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Menciones Inactivas</p>
              <p className="text-2xl font-bold text-secondary-900">{estadisticas.inactivas}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <Input
              placeholder="Buscar por nombre..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              icon={<Search className="w-4 h-4" />}
              size="md"
            />
          </div>
          <div>
            <select
              className="w-full h-12 px-4 py-3 text-base border border-secondary-300 bg-white text-secondary-900 placeholder-secondary-400 rounded-lg focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500/20 transition-colors duration-200"
              value={filtros.activo}
              onChange={(e) => handleFiltroChange('activo', e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="true">Activa</option>
              <option value="false">Inactiva</option>
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
              data={menciones}
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
        title="Crear Nueva Mención"
        size="xl"
      >
        <MencionForm
          onSubmit={handleCrearMencion}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedMencion(null);
        }}
        title="Editar Mención"
        size="xl"
      >
        {selectedMencion && (
          <MencionForm
            mencion={selectedMencion}
            onSubmit={handleEditarMencion}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedMencion(null);
            }}
            isEdit={true}
          />
        )}
      </Modal>

      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedMencion(null);
        }}
        title="Detalle de la Mención"
        size="xl"
      >
        {selectedMencion && (
          <MencionDetalle
            mencion={selectedMencion}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedMencion(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default MencionesPage;
