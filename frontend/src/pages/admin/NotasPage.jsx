import React, { useState, useEffect } from 'react';
import { Plus, Search, ClipboardCheck, TrendingUp, TrendingDown, Edit, Trash2, Eye } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { useDebounce } from '../../hooks/useDebounce';
import { notificationService } from '../../services/notificationService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Table, { DataTable } from '../../components/ui/Table';
import Modal from '../../components/ui/ModalImproved';
import Loading from '../../components/ui/Loading';
import NotaForm from '../../components/admin/NotaForm';
import NotaDetalle from '../../components/admin/NotaDetalle';

const NotasPage = () => {
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedNota, setSelectedNota] = useState(null);
  
  // Estados para filtros y paginación
  const [filtros, setFiltros] = useState({
    search: '',
    gestion: '',
    estado: '',
    paralelo: '',
    id_tipo_evaluacion: '',
    sortBy: 'fecha_registro',
    sortOrder: 'DESC',
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
    total_notas: 0,
    promedio_general: 0,
    aprobados: 0,
    reprobados: 0
  });

  // Cargar datos iniciales
  useEffect(() => {
    cargarNotas();
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

  const cargarNotas = async () => {
    try {
      setLoading(true);
      const params = {
        estudiante: filtros.search,
        gestion: filtros.gestion,
        estado: filtros.estado,
        paralelo: filtros.paralelo,
        id_tipo_evaluacion: filtros.id_tipo_evaluacion,
        sortBy: filtros.sortBy,
        sortOrder: filtros.sortOrder,
        page: filtros.page,
        limit: filtros.limit
      };
      const response = await dataService.notas.obtenerTodas(params);
      setNotas(response.data);
      setPaginacion(response.pagination);
    } catch (error) {
      if (!window.__isSessionExpired) {
        notificationService.error('Error al cargar notas: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const response = await dataService.notas.obtenerEstadisticas();
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
    setFiltros(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const handleCrearNota = async (data) => {
    let loadingToast = null;
    try {
      loadingToast = notificationService.loading('Registrando nota...');
      await dataService.notas.crear(data);
      notificationService.success('Nota registrada exitosamente');
      setShowCreateModal(false);
      cargarNotas();
      cargarEstadisticas();
    } catch (error) {
      if (!window.__isSessionExpired) {
        notificationService.error('Error al registrar nota: ' + error.message);
      }
    } finally {
      if (loadingToast) notificationService.dismissToast(loadingToast);
    }
  };

  const handleEditarNota = async (data) => {
    let loadingToast = null;
    try {
      loadingToast = notificationService.loading('Actualizando nota...');
      await dataService.notas.actualizar(selectedNota.id_nota, data);
      notificationService.success('Nota actualizada exitosamente');
      setShowEditModal(false);
      setSelectedNota(null);
      cargarNotas();
      cargarEstadisticas();
    } catch (error) {
      if (!window.__isSessionExpired) {
        notificationService.error('Error al actualizar nota: ' + error.message);
      }
    } finally {
      if (loadingToast) notificationService.dismissToast(loadingToast);
    }
  };

  const handleEliminarNota = async (nota) => {
    const confirmed = await notificationService.confirmDelete(
      `Nota de ${nota.estudiante_nombre}`
    );
    if (confirmed) {
      let loadingToast = null;
      try {
        loadingToast = notificationService.loading('Eliminando nota...');
        await dataService.notas.eliminar(nota.id_nota);
        notificationService.success('Nota eliminada exitosamente');
        cargarNotas();
        cargarEstadisticas();
      } catch (error) {
        if (!window.__isSessionExpired) {
          notificationService.error('Error al eliminar nota: ' + error.message);
        }
      } finally {
        if (loadingToast) notificationService.dismissToast(loadingToast);
      }
    }
  };

  const columnas = [
    {
      key: 'estudiante_nombre',
      title: 'Estudiante',
      render: (nota) => `${nota.estudiante_nombre} ${nota.estudiante_apellido}`
    },
    {
      key: 'materia_nombre',
      title: 'Materia'
    },
    {
      key: 'tipo_evaluacion_nombre',
      title: 'Tipo Evaluación'
    },
    {
      key: 'nota_final',
      title: 'Calificación',
      render: (nota) => (
        <span className={`font-semibold ${
          nota.nota_final >= 51 ? 'text-green-600' : 'text-red-600'
        }`}>
          {nota.nota_final}
        </span>
      )
    },
    {
      key: 'estado',
      title: 'Estado',
      render: (nota) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          nota.nota_final >= 51 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {nota.nota_final >= 51 ? 'Aprobado' : 'Reprobado'}
        </span>
      )
    },
    {
      key: 'acciones',
      title: 'Acciones',
      render: (nota) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={async () => {
              try {
                const response = await dataService.notas.obtenerPorId(nota.id_nota);
                if (response.success !== false) {
                  setSelectedNota(response.data);
                  setShowDetailModal(true);
                }
              } catch (error) {
                notificationService.error('Error al obtener detalle de nota: ' + error.message);
              }
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={async () => {
              try {
                const response = await dataService.notas.obtenerPorId(nota.id_nota);
                if (response.success !== false) {
                  setSelectedNota(response.data);
                  setShowEditModal(true);
                }
              } catch (error) {
                notificationService.error('Error al obtener detalle de nota: ' + error.message);
              }
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleEliminarNota(nota)}
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
          <h1 className="text-2xl sm:text-2xl font-bold text-secondary-900">
            Gestión de Notas
          </h1>
          <p className="text-secondary-600 mt-1">
            Administra las calificaciones del sistema
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Nota
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <ClipboardCheck className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Total Notas</p>
              <p className="text-2xl font-bold text-secondary-900">
                {estadisticas.total_notas}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Aprobados</p>
              <p className="text-2xl font-bold text-secondary-900">
                {estadisticas.aprobados}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <TrendingDown className="w-8 h-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Reprobados</p>
              <p className="text-2xl font-bold text-secondary-900">
                {estadisticas.reprobados}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <ClipboardCheck className="w-8 h-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Promedio</p>
              <p className="text-2xl font-bold text-secondary-900">
                {estadisticas.promedio_general}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Input
              placeholder="Buscar por estudiante o materia..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              icon={<Search className="w-4 h-4" />}
              size="md"
            />
          </div>
          <div>
            <select
              className="w-full h-12 px-4 py-3 text-base border border-secondary-300 bg-white text-secondary-900 placeholder-secondary-400 rounded-lg focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500/20 transition-colors duration-200"
              value={filtros.gestion}
              onChange={(e) => handleFiltroChange('gestion', e.target.value)}
            >
              <option value="">Todas las gestiones</option>
              {(() => {
                const currentYear = new Date().getFullYear();
                return [
                  `${currentYear}`,
                  `${currentYear - 1}`,
                  `${currentYear + 1}`,
                ].map((gestion) => (
                  <option key={gestion} value={gestion}>
                    {gestion}
                  </option>
                ));
              })()}
            </select>
          </div>
          <div>
            <select
              className="w-full h-12 px-4 py-3 text-base border border-secondary-300 bg-white text-secondary-900 placeholder-secondary-400 rounded-lg focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500/20 transition-colors duration-200"
              value={filtros.estado}
              onChange={(e) => handleFiltroChange('estado', e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="aprobado">Aprobado</option>
              <option value="reprobado">Reprobado</option>
            </select>
          </div>
          <div>
            <select
              className="w-full h-12 px-4 py-3 text-base border border-secondary-300 bg-white text-secondary-900 placeholder-secondary-400 rounded-lg focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500/20 transition-colors duration-200"
              value={filtros.paralelo}
              onChange={(e) => handleFiltroChange('paralelo', e.target.value)}
            >
              <option value="">Todos los paralelos</option>
              <option value="A">Paralelo A</option>
              <option value="B">Paralelo B</option>
              <option value="C">Paralelo C</option>
              <option value="D">Paralelo D</option>
            </select>
          </div>
          <div>
            <select
              className="w-full h-12 px-4 py-3 text-base border border-secondary-300 bg-white text-secondary-900 placeholder-secondary-400 rounded-lg focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500/20 transition-colors duration-200"
              value={filtros.id_tipo_evaluacion}
              onChange={(e) => handleFiltroChange('id_tipo_evaluacion', e.target.value)}
            >
              <option value="">Todos los tipos</option>
              <option value="1">Primer Parcial</option>
              <option value="2">Segundo Parcial</option>
              <option value="3">Examen Final</option>
              <option value="4">Segunda Instancia</option>
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
              data={notas}
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
        title="Registrar Nueva Nota"
        size="xl"
      >
        <NotaForm
          onSubmit={handleCrearNota}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedNota(null);
        }}
        title="Editar Nota"
        size="xl"
      >
        {selectedNota && (
          <NotaForm
            nota={selectedNota}
            onSubmit={handleEditarNota}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedNota(null);
            }}
            isEdit={true}
          />
        )}
      </Modal>

      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedNota(null);
        }}
        title="Detalle de la Nota"
        size="xl"
      >
        {selectedNota && (
          <NotaDetalle
            nota={selectedNota}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedNota(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default NotasPage;
