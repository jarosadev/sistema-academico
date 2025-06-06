import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Search, Calendar, Users, BookOpen, AlertCircle, CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { notificationService } from '../../services/notificationService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { DataTable } from '../../components/ui/Table';
import Modal from '../../components/ui/ModalImproved';
import Loading from '../../components/ui/Loading';
import { useDebounce } from '../../hooks/useDebounce';

const CierreMateriasPage = () => {
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMateria, setSelectedMateria] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState(''); // 'cerrar' o 'abrir'
  
  // Estados para filtros
  const [filtros, setFiltros] = useState({
    gestion: '', // Vacío para "Todos los años"
    periodo: '', // Vacío para "Todos los periodos"
    estado: '', // Vacío para "Todos", 'abierto' o 'cerrado'
    search: '',
    page: 1,
    limit: 10
  });

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 500);

  // Estado para paginación
  const [paginacion, setPaginacion] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Estadísticas
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    cerradas: 0,
    abiertas: 0
  });

  // Generar años disponibles (últimos 5 años)
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    cargarMaterias();
  }, [filtros]);

  useEffect(() => {
    setFiltros(prev => ({
      ...prev,
      search: debouncedSearch,
      page: 1 // Reset a primera página cuando cambia la búsqueda
    }));
  }, [debouncedSearch]);

  const cargarMaterias = async () => {
    try {
      setLoading(true);
      
      // Preparar parámetros para la API
      const params = {
        ...filtros,
        // Si gestion está vacío, no lo enviamos para obtener todos los años
        ...(filtros.gestion && { gestion: filtros.gestion }),
        // Si periodo está vacío, no lo enviamos para obtener todos los periodos
        ...(filtros.periodo && { periodo: filtros.periodo })
      };
      
      const response = await dataService.materias.obtenerEstadoCierre(params);
      const materiasData = response.data || [];
      const paginationData = response.pagination || {};
      
      setMaterias(materiasData);
      
      // Actualizar paginación con datos del backend
      setPaginacion({
        page: paginationData.page || filtros.page,
        limit: paginationData.limit || filtros.limit,
        total: paginationData.total || 0,
        totalPages: paginationData.totalPages || 0
      });
      
      // Calcular estadísticas
      const stats = materiasData.reduce((acc, materia) => {
        acc.total++;
        if (materia.cerrado) {
          acc.cerradas++;
        } else {
          acc.abiertas++;
        }
        return acc;
      }, { total: 0, cerradas: 0, abiertas: 0 });
      
      setEstadisticas(stats);
    } catch (error) {
      console.error('Error al cargar materias:', error);
      notificationService.error('Error al cargar el estado de las materias');
    } finally {
      setLoading(false);
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

  const handleCerrarMateria = async () => {
    if (!selectedMateria) return;

    let loadingToast = null;
    try {
      loadingToast = notificationService.loading('Cerrando materia...');
      
      await dataService.materias.cerrar(selectedMateria.id_materia, {
        gestion: selectedMateria.gestion,
        periodo: selectedMateria.periodo,
        paralelo: selectedMateria.paralelo
      });
      
      notificationService.success('Materia cerrada exitosamente');
      setShowConfirmModal(false);
      setSelectedMateria(null);
      cargarMaterias();
    } catch (error) {
      notificationService.error('Error al cerrar la materia: ' + error.message);
    } finally {
      if (loadingToast) notificationService.dismissToast(loadingToast);
    }
  };

  const handleAbrirMateria = async () => {
    if (!selectedMateria) return;

    let loadingToast = null;
    try {
      loadingToast = notificationService.loading('Abriendo materia...');
      
      await dataService.materias.abrir(selectedMateria.id_materia, {
        gestion: selectedMateria.gestion,
        periodo: selectedMateria.periodo,
        paralelo: selectedMateria.paralelo,
        idDocente: selectedMateria.id_docente
      });
      
      notificationService.success('Materia abierta exitosamente');
      setShowConfirmModal(false);
      setSelectedMateria(null);
      cargarMaterias();
    } catch (error) {
      notificationService.error('Error al abrir la materia: ' + error.message);
    } finally {
      if (loadingToast) notificationService.dismissToast(loadingToast);
    }
  };

  const handleAction = (materia, action) => {
    setSelectedMateria(materia);
    setActionType(action);
    setShowConfirmModal(true);
  };

  const columnas = [
    {
      key: 'materia_sigla',
      title: 'Sigla',
      render: (materia) => (
        <span className="font-medium">{materia.materia_sigla}</span>
      )
    },
    {
      key: 'materia_nombre',
      title: 'Materia',
      render: (materia) => (
        <div>
          <p className="font-medium">{materia.materia_nombre}</p>
          <p className="text-sm text-secondary-600">
            Semestre {materia.semestre} | Gestión {materia.gestion}-{materia.periodo}
          </p>
        </div>
      )
    },
    {
      key: 'docente',
      title: 'Docente',
      render: (materia) => (
        <div>
          <p className="font-medium">{materia.docente_nombre} {materia.docente_apellido}</p>
          <p className="text-sm text-secondary-600">Paralelo {materia.paralelo}</p>
        </div>
      )
    },
    {
      key: 'estudiantes',
      title: 'Estudiantes',
      render: (materia) => (
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1">
            <Users className="w-4 h-4 text-secondary-600" />
            <span className="font-medium">{materia.total_estudiantes || 0}</span>
          </div>
          {materia.cerrado && (
            <div className="text-xs mt-1 space-y-1">
              <div className="flex justify-center space-x-2">
                <span className="text-green-600" title="Aprobados">
                  <CheckCircle className="w-3 h-3 inline mr-1" />
                  {materia.aprobados || 0}
                </span>
                <span className="text-red-600" title="Reprobados">
                  <XCircle className="w-3 h-3 inline mr-1" />
                  {materia.reprobados || 0}
                </span>
                <span className="text-yellow-600" title="Abandonados">
                  <AlertCircle className="w-3 h-3 inline mr-1" />
                  {materia.abandonados || 0}
                </span>
              </div>
            </div>
          )}
          {!materia.cerrado && materia.inscritos > 0 && (
            <div className="text-xs text-blue-600 mt-1">
              <Clock className="w-3 h-3 inline mr-1" />
              En curso: {materia.inscritos}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'estado',
      title: 'Estado',
      render: (materia) => (
        <div className="text-center">
          {materia.cerrado ? (
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <Lock className="w-3 h-3 mr-1" />
                Cerrada
              </span>
              {materia.fecha_cierre && (
                <p className="text-xs text-secondary-600 mt-1">
                  {new Date(materia.fecha_cierre).toLocaleDateString()}
                </p>
              )}
            </div>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <Unlock className="w-3 h-3 mr-1" />
              Abierta
            </span>
          )}
        </div>
      )
    },
    {
      key: 'acciones',
      title: 'Acciones',
      render: (materia) => (
        <div className="flex justify-center space-x-2">
          {materia.cerrado ? (
            <Button
              size="sm"
              variant="success"
              onClick={() => handleAction(materia, 'abrir')}
              title="Abrir materia"
            >
              <Unlock className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleAction(materia, 'cerrar')}
              title="Cerrar materia"
            >
              <Lock className="w-4 h-4" />
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900">Gestión de Cierre de Materias</h1>
        <p className="text-secondary-600 mt-1">Administra el estado de apertura y cierre de las materias</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <BookOpen className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Total Materias</p>
              <p className="text-2xl font-bold text-secondary-900">{estadisticas.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <Unlock className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Abiertas</p>
              <p className="text-2xl font-bold text-secondary-900">{estadisticas.abiertas}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <Lock className="w-8 h-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Cerradas</p>
              <p className="text-2xl font-bold text-secondary-900">{estadisticas.cerradas}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Input
              placeholder="Buscar materia o docente..."
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
              <option value="">Todos los años</option>
              {availableYears.map(year => (
                <option key={year} value={year}>Gestión {year}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              className="w-full h-12 px-4 py-3 text-base border border-secondary-300 bg-white text-secondary-900 placeholder-secondary-400 rounded-lg focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500/20 transition-colors duration-200"
              value={filtros.periodo}
              onChange={(e) => handleFiltroChange('periodo', e.target.value)}
            >
              <option value="">Todos los periodos</option>
              <option value="1">Periodo 1</option>
              <option value="2">Periodo 2</option>
              <option value="3">Periodo 3</option>
              <option value="4">Periodo 4</option>
            </select>
          </div>
          <div>
            <select
              className="w-full h-12 px-4 py-3 text-base border border-secondary-300 bg-white text-secondary-900 placeholder-secondary-400 rounded-lg focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500/20 transition-colors duration-200"
              value={filtros.estado}
              onChange={(e) => handleFiltroChange('estado', e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="abierto">Abiertas</option>
              <option value="cerrado">Cerradas</option>
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
              responsive={true}
            />
            {/* Paginación */}
            {paginacion.totalPages > 1 && (
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
                  Página {paginacion.page} de {paginacion.totalPages} ({paginacion.total} registros)
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
            )}
          </>
        )}
      </Card>

      {/* Modal de confirmación */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setSelectedMateria(null);
          setActionType('');
        }}
        title={actionType === 'cerrar' ? 'Confirmar Cierre de Materia' : 'Confirmar Apertura de Materia'}
        size="md"
      >
        {selectedMateria && (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    {actionType === 'cerrar' ? 'Atención: Esta acción cerrará la materia' : 'Atención: Esta acción reabrirá la materia'}
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    {actionType === 'cerrar' ? (
                      <ul className="list-disc list-inside space-y-1">
                        <li>Se calcularán las notas finales de todos los estudiantes</li>
                        <li>Se actualizará el estado de cada estudiante (aprobado/reprobado/abandonado)</li>
                        <li>No se podrán registrar más notas</li>
                        <li>Esta acción puede ser revertida por un administrador</li>
                      </ul>
                    ) : (
                      <ul className="list-disc list-inside space-y-1">
                        <li>Se cambiarán todos los estados a "inscrito"</li>
                        <li>Se eliminarán las notas finales calculadas</li>
                        <li>Se podrán registrar notas nuevamente</li>
                        <li>Los estudiantes volverán a estar activos en la materia</li>
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-secondary-900 mb-2">Detalles de la materia:</h4>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-secondary-600">Materia:</dt>
                  <dd className="font-medium">{selectedMateria.materia_nombre}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-secondary-600">Docente:</dt>
                  <dd className="font-medium">{selectedMateria.docente_nombre} {selectedMateria.docente_apellido}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-secondary-600">Paralelo:</dt>
                  <dd className="font-medium">{selectedMateria.paralelo}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-secondary-600">Gestión:</dt>
                  <dd className="font-medium">{selectedMateria.gestion} - Periodo {selectedMateria.periodo}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-secondary-600">Estudiantes:</dt>
                  <dd className="font-medium">{selectedMateria.total_estudiantes || 0}</dd>
                </div>
              </dl>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedMateria(null);
                  setActionType('');
                }}
              >
                Cancelar
              </Button>
              <Button
                variant={actionType === 'cerrar' ? 'danger' : 'success'}
                onClick={actionType === 'cerrar' ? handleCerrarMateria : handleAbrirMateria}
              >
                {actionType === 'cerrar' ? (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Cerrar Materia
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4 mr-2" />
                    Abrir Materia
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CierreMateriasPage;
