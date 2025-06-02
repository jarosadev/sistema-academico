import React, { useState, useEffect } from 'react';
import { Search, Clock, AlertCircle, Download, FileText, User, Calendar } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { useDebounce } from '../../hooks/useDebounce';
import { notificationService } from '../../services/notificationService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Table, { DataTable } from '../../components/ui/Table';
import Modal from '../../components/ui/ModalImproved';
import Loading from '../../components/ui/Loading';
import AuditoriaDetalle from '../../components/admin/AuditoriaDetalle';

const AuditoriaPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para modales
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  
  // Estados para filtros y paginación
  const [filtros, setFiltros] = useState({
    search: '',
    tipo_accion: '',
    tabla: '',
    fecha_inicio: '',
    fecha_fin: '',
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
    total_registros: 0,
    acciones_hoy: 0,
    usuarios_unicos: 0,
    tablas_afectadas: 0,
    detalles: {
      por_accion: [],
      por_tabla: [],
      actividad_diaria: []
    }
  });

  // Cargar datos iniciales
  useEffect(() => {
    cargarLogs();
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

  const cargarLogs = async () => {
    try {
      setLoading(true);
      const response = await dataService.auditoria.obtenerLogs(filtros);
      setLogs(response.data);
      setPaginacion(response.pagination);
    } catch (error) {
      notificationService.error('Error al cargar logs de auditoría: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const response = await dataService.auditoria.obtenerEstadisticas();
      setEstadisticas(response.data);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      notificationService.error('Error al cargar estadísticas');
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

  const handleExportarLogs = async () => {
    let loadingToast = null;
    try {
      loadingToast = notificationService.loading('Exportando logs...');
      const response = await dataService.auditoria.exportarLogs(filtros);
      
      // Crear un blob con la respuesta
      const blob = new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `auditoria_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      notificationService.success('Logs exportados exitosamente');
    } catch (error) {
      notificationService.error('Error al exportar logs: ' + error.message);
    } finally {
      if (loadingToast) notificationService.dismissToast(loadingToast);
    }
  };

  const columnas = [
    {
      key: 'fecha_accion',
      title: 'Fecha y Hora',
      render: (log) => (
        <div className="whitespace-normal">
          {new Date(log.fecha_accion).toLocaleString()}
        </div>
      )
    },
    {
      key: 'id_usuario',
      title: 'Usuario',
      render: (log) => (
        <div className="whitespace-normal break-words">
          {log.id_usuario || 'Sistema'}
        </div>
      )
    },
    {
      key: 'accion',
      title: 'Acción',
      render: (log) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          log.accion === 'INSERT' ? 'bg-green-100 text-green-800' :
          log.accion === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
          log.accion === 'DELETE' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {log.accion}
        </span>
      )
    },
    {
      key: 'tabla_afectada',
      title: 'Tabla',
      render: (log) => (
        <div className="whitespace-normal break-words">
          {log.tabla_afectada}
        </div>
      )
    },
    {
      key: 'valores',
      title: 'Cambios',
      render: (log) => (
        <div className="text-sm">
          <div className="block sm:hidden max-w-[180px] break-words whitespace-pre-wrap">
            {log.valores_nuevos ? JSON.stringify(log.valores_nuevos).substring(0, 80) + '...' : '-'}
          </div>
          <div className="hidden sm:block max-w-[200px] whitespace-nowrap overflow-hidden text-ellipsis">
            {log.valores_nuevos ? JSON.stringify(log.valores_nuevos) : '-'}
          </div>
        </div>
      )
    },
    {
      key: 'acciones',
      title: 'Acciones',
      render: (log) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setSelectedLog(log);
              setShowDetailModal(true);
            }}
            title="Ver detalles"
          >
            <FileText className="w-4 h-4" />
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
          <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900">Auditoría del Sistema</h1>
          <p className="text-secondary-600 mt-1">Monitorea las acciones realizadas en el sistema</p>
        </div>
        <Button onClick={handleExportarLogs} className="w-full sm:w-auto">
          <Download className="w-4 h-4 mr-2" />
          Exportar Logs
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Total Registros</p>
              <p className="text-2xl font-bold text-secondary-900">{estadisticas.total_registros}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <AlertCircle className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Acciones Hoy</p>
              <p className="text-2xl font-bold text-secondary-900">{estadisticas.acciones_hoy}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <User className="w-8 h-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Usuarios</p>
              <p className="text-2xl font-bold text-secondary-900">{estadisticas.usuarios_unicos}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <FileText className="w-8 h-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Tablas</p>
              <p className="text-2xl font-bold text-secondary-900">{estadisticas.tablas_afectadas}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-4 overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 -mx-2 px-2 overflow-x-auto">
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="mb-2 text-sm font-medium text-secondary-700">
              Buscar
            </label>
            <Input
              placeholder="Buscar por usuario, tabla o acción..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              icon={<Search className="w-4 h-4" />}
              size="md"
              className="w-full"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-2 text-sm font-medium text-secondary-700">
              Tipo de Acción
            </label>
            <select
              className="h-12 px-4 py-2 text-base border border-secondary-300 bg-white text-secondary-900 placeholder-secondary-400 rounded-lg focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500/20 transition-colors duration-200"
              value={filtros.tipo_accion}
              onChange={(e) => handleFiltroChange('tipo_accion', e.target.value)}
            >
              <option value="">Todas las acciones</option>
              <option value="INSERT">Inserción</option>
              <option value="UPDATE">Actualización</option>
              <option value="DELETE">Eliminación</option>
            </select>
          </div>
          <div>
            <Input
              type="date"
              label="Fecha Inicio"
              value={filtros.fecha_inicio}
              onChange={(e) => handleFiltroChange('fecha_inicio', e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <Input
              type="date"
              label="Fecha Fin"
              value={filtros.fecha_fin}
              onChange={(e) => handleFiltroChange('fecha_fin', e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </Card>

      {/* Tabla */}
      <Card className="p-2 sm:p-4">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loading />
          </div>
        ) : (
          <>
            <DataTable
              data={logs}
              columns={columnas}
              loading={loading}
              onRowClick={null}
              responsive={true}
            />
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t border-secondary-200 px-2">
              <Button
                variant="secondary"
                disabled={paginacion.page <= 1}
                onClick={() => handlePageChange(paginacion.page - 1)}
                className="w-full sm:w-auto"
              >
                Anterior
              </Button>
              <span className="text-sm sm:text-base font-medium text-secondary-700 order-first sm:order-none whitespace-nowrap">
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

      {/* Modal de Detalle */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedLog(null);
        }}
        title="Detalle del Log"
        size="xl"
      >
        {selectedLog && (
          <AuditoriaDetalle
            log={selectedLog}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedLog(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default AuditoriaPage;
