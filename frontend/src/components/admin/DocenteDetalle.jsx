import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Briefcase, Calendar, BookOpen, Users, Award, Clock } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Loading from '../ui/Loading';
import Modal from '../ui/ModalImproved';
import { dataService } from '../../services/dataService';
import { notificationService } from '../../services/notificationService';

const DocenteDetalle = ({ docente, onClose }) => {
  const [materias, setMaterias] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [cargaAcademica, setCargaAcademica] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [showAsignarModal, setShowAsignarModal] = useState(false);
  const [materiasDisponibles, setMateriasDisponibles] = useState([]);

  useEffect(() => {
    cargarDatosAdicionales();
  }, [docente.id_docente]);

  const cargarDatosAdicionales = async () => {
    try {
      setLoading(true);
      const [materiasRes, estudiantesRes, cargaRes] = await Promise.all([
        dataService.docentes.getMaterias(docente.id_docente).catch(() => ({ data: [] })),
        dataService.docentes.getEstudiantes(docente.id_docente).catch(() => ({ data: [] })),
        dataService.docentes.getCargaAcademica(docente.id_docente).catch(() => ({ data: [] }))
      ]);
      
      setMaterias(materiasRes.data || []);
      setEstudiantes(estudiantesRes.data || []);
      setCargaAcademica(cargaRes.data || []);
    } catch (error) {
      console.error('Error al cargar datos adicionales:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarMateriasDisponibles = async () => {
    try {
      const response = await dataService.materias.obtenerTodas({ limit: 100 });
      // Filtrar materias que no están asignadas al docente
      const materiasAsignadas = materias.map(m => m.id_materia);
      const disponibles = response.data.filter(m => !materiasAsignadas.includes(m.id_materia));
      setMateriasDisponibles(disponibles);
    } catch (error) {
      console.error('Error al cargar materias disponibles:', error);
    }
  };

  const [selectedParalelo, setSelectedParalelo] = useState('A');
  const [selectedPeriodo, setSelectedPeriodo] = useState(1);
  const [asignacionExistente, setAsignacionExistente] = useState(null);

  const handleAsignarMateria = async (materiaId) => {
    let loadingToast = null;
    try {
      const currentYear = new Date().getFullYear();
      
      // Verificar si ya existe una asignación
      const materiasActuales = await dataService.docentes.getMaterias(docente.id_docente);
      const existente = materiasActuales.data.find(m => 
        m.id_materia === materiaId && 
        m.gestion === currentYear &&
        m.periodo === selectedPeriodo
      );

      if (existente) {
        setAsignacionExistente({
          materiaId,
          nombre: existente.nombre,
          paralelo: existente.paralelo,
          gestion: existente.gestion,
          periodo: existente.periodo
        });
        return;
      }

      loadingToast = notificationService.loading('Asignando materia...');
      await dataService.docentes.asignarMateria(docente.id_docente, {
        id_materia: materiaId,
        gestion: currentYear,
        paralelo: selectedParalelo,
        periodo: selectedPeriodo
      });
      notificationService.success('Materia asignada exitosamente');
      setShowAsignarModal(false);
      cargarDatosAdicionales();
    } catch (error) {
      notificationService.error('Error al asignar materia: ' + error.message);
    } finally {
      if (loadingToast) notificationService.dismissToast(loadingToast);
    }
  };

  const handleConfirmarCambioParalelo = async () => {
    if (!asignacionExistente) return;

    let loadingToast = null;
    try {
      loadingToast = notificationService.loading('Actualizando asignación...');
      
      // Primero removemos la asignación existente
      await dataService.docentes.removerMateria(
        docente.id_docente, 
        asignacionExistente.materiaId, 
        { 
          gestion: asignacionExistente.gestion,
          paralelo: asignacionExistente.paralelo,
          periodo: asignacionExistente.periodo
        }
      );

      // Luego creamos la nueva asignación
      await dataService.docentes.asignarMateria(docente.id_docente, {
        id_materia: asignacionExistente.materiaId,
        gestion: asignacionExistente.gestion,
        paralelo: selectedParalelo,
        periodo: asignacionExistente.periodo
      });

      notificationService.success('Paralelo actualizado exitosamente');
      setAsignacionExistente(null);
      setShowAsignarModal(false);
      cargarDatosAdicionales();
    } catch (error) {
      notificationService.error('Error al actualizar paralelo: ' + error.message);
    } finally {
      if (loadingToast) notificationService.dismissToast(loadingToast);
    }
  };

  const handleRemoverMateria = async (materiaId, gestion, paralelo = 'A') => {
    const confirmed = await notificationService.confirm({
      title: '¿Está seguro que desea remover esta materia?',
      text: 'Esta acción no se puede deshacer'
    });

    if (confirmed) {
      let loadingToast = null;
      try {
        loadingToast = notificationService.loading('Removiendo materia...');
        await dataService.docentes.removerMateria(docente.id_docente, materiaId, { gestion, paralelo });
        notificationService.success('Materia removida exitosamente');
        cargarDatosAdicionales();
      } catch (error) {
        notificationService.error('Error al remover materia: ' + error.message);
      } finally {
        if (loadingToast) notificationService.dismissToast(loadingToast);
      }
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No disponible';
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  const getEstadoColor = (activo) => {
    return activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const calcularAnosServicio = () => {
    if (!docente.fecha_contratacion) return 0;
    return Math.floor((new Date() - new Date(docente.fecha_contratacion)) / (365.25 * 24 * 60 * 60 * 1000));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto px-3 sm:px-0">
      {/* Header con información básica */}
      <Card className="bg-white rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-100 rounded-xl flex-shrink-0 flex items-center justify-center mx-auto sm:mx-0">
            <User className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <h2 className="text-xl sm:text-2xl font-bold text-secondary-900 break-words">
                {docente.nombre} {docente.apellido}
              </h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium self-center sm:self-auto ${getEstadoColor(docente.activo)}`}>
                {docente.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-sm text-secondary-600">CI</p>
                <p className="font-medium">{docente.ci}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-600">Especialidad</p>
                <p className="font-medium">{docente.especialidad}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-600">Correo</p>
                <p className="font-medium text-sm break-all">{docente.correo}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-600">Teléfono</p>
                <p className="font-medium">{docente.telefono || 'No disponible'}</p>
              </div>
            </div>
            <div className="mt-4 text-center sm:text-left">
              <Button
                size="sm"
                onClick={() => {
                  cargarMateriasDisponibles();
                  setShowAsignarModal(true);
                }}
                className="w-full sm:w-auto"
              >
                Asignar Materia
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Estadísticas en cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-semibold text-secondary-900">
                {materias.length}
              </p>
              <p className="text-xs sm:text-sm text-secondary-600">Materias Asignadas</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-semibold text-secondary-900">
                {estudiantes.length}
              </p>
              <p className="text-xs sm:text-sm text-secondary-600">Estudiantes</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-semibold text-secondary-900">
                {calcularAnosServicio()}
              </p>
              <p className="text-xs sm:text-sm text-secondary-600">Años de Servicio</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
              <Award className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-semibold text-secondary-900">
                {cargaAcademica.length}
              </p>
              <p className="text-xs sm:text-sm text-secondary-600">Carga Académica</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Información Profesional */}
      <Card className="overflow-hidden">
        <div className="px-3 sm:px-4 py-3 border-b border-secondary-200">
          <h3 className="text-base sm:text-lg font-semibold text-secondary-900">Información Profesional</h3>
        </div>
        <div className="p-3 sm:p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-secondary-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-secondary-600">Fecha de Contratación</p>
                <p className="font-medium break-words">{formatearFecha(docente.fecha_contratacion)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-secondary-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-secondary-600">Último Acceso</p>
                <p className="font-medium break-words">{formatearFecha(docente.ultimo_acceso)}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Lista de Materias */}
      <Card className="overflow-hidden">
        <div className="px-3 sm:px-4 py-3 border-b border-secondary-200 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <h3 className="text-base sm:text-lg font-semibold text-secondary-900">Materias Asignadas</h3>
          <Button
            size="sm"
            onClick={() => {
              cargarMateriasDisponibles();
              setShowAsignarModal(true);
            }}
            className="w-full sm:w-auto"
          >
            Asignar Nueva
          </Button>
        </div>
        <div className="divide-y divide-secondary-200">
          {materias.length > 0 ? (
            materias.map((materia, index) => (
              <div key={index} className="p-3 sm:p-4 hover:bg-secondary-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm sm:text-base font-medium text-secondary-900 break-words">
                      {materia.nombre}
                    </h4>
                    <div className="flex flex-wrap gap-2 mt-1 text-xs sm:text-sm text-secondary-600">
                      <span>{materia.sigla}</span>
                      <span>•</span>
                      <span>Sem. {materia.semestre}</span>
                      <span>•</span>
                      <span>Gestión {materia.gestion}</span>
                      <span>•</span>
                      <span>Paralelo {materia.paralelo}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-secondary-600 mt-1">
                      {materia.mencion_nombre}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleRemoverMateria(materia.id_materia, materia.gestion, materia.paralelo)}
                      className="w-full sm:w-auto"
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-secondary-600">
              <p className="text-sm sm:text-base">No hay materias asignadas</p>
            </div>
          )}
        </div>
      </Card>

      {/* Lista de Estudiantes */}
      <Card className="overflow-hidden">
        <div className="px-3 sm:px-4 py-3 border-b border-secondary-200">
          <h3 className="text-base sm:text-lg font-semibold text-secondary-900">Estudiantes Asignados</h3>
        </div>
        <div className="divide-y divide-secondary-200">
          {estudiantes.length > 0 ? (
            estudiantes.map((estudiante, index) => (
              <div key={index} className="p-3 sm:p-4 hover:bg-secondary-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div className="min-w-0">
                    <h4 className="text-sm sm:text-base font-medium text-secondary-900 break-words">
                      {estudiante.nombre} {estudiante.apellido}
                    </h4>
                    <div className="flex flex-wrap gap-2 mt-1 text-xs sm:text-sm text-secondary-600">
                      <span>CI: {estudiante.ci}</span>
                      <span>•</span>
                      <span className="break-all">{estudiante.correo}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      estudiante.estado_academico === 'activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {estudiante.estado_academico}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-secondary-600">
              <p className="text-sm sm:text-base">No hay estudiantes asignados</p>
            </div>
          )}
        </div>
      </Card>

      {/* Modal para asignar materia */}
      <Modal
        isOpen={showAsignarModal}
        onClose={() => {
          setShowAsignarModal(false);
          setAsignacionExistente(null);
          setSelectedParalelo('A');
        }}
        title="Asignar Materia"
        size="xl"
      >
        <div className="space-y-4">
          {asignacionExistente ? (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">
                  La materia <span className="font-medium">{asignacionExistente.nombre}</span> ya está asignada 
                  al paralelo <span className="font-medium">{asignacionExistente.paralelo}</span> en la 
                  gestión <span className="font-medium">{asignacionExistente.gestion}</span>.
                </p>
                <p className="mt-2 text-yellow-700">
                  ¿Desea cambiar al paralelo {selectedParalelo}?
                </p>
              </div>

              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-secondary-700">
                  Nuevo Paralelo:
                </label>
                <select
                  value={selectedParalelo}
                  onChange={(e) => setSelectedParalelo(e.target.value)}
                  className="mt-1 block w-24 pl-3 pr-10 py-2 text-base border-secondary-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                >
                  {['A', 'B', 'C', 'D', 'E'].map(p => (
                    <option key={p} value={p}>Paralelo {p}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setAsignacionExistente(null);
                    setSelectedParalelo('A');
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleConfirmarCambioParalelo}>
                  Confirmar Cambio
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <p className="text-secondary-600">
                  Seleccione una materia para asignar al docente {docente.nombre} {docente.apellido}:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex-1">
                    <label htmlFor="periodo-select" className="block text-sm font-medium text-secondary-700 mb-2">
                      Periodo
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <select
                        id="periodo-select"
                        value={selectedPeriodo}
                        onChange={(e) => setSelectedPeriodo(parseInt(e.target.value))}
                        className="block w-full rounded-md border-secondary-300 py-2.5 pl-3 pr-10 text-secondary-900 hover:border-secondary-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm transition-all duration-150 bg-white shadow-sm hover:bg-secondary-50"
                      >
                        {[1, 2, 3, 4].map(p => (
                          <option key={p} value={p}>
                            {p === 1 ? 'Primero' : p === 2 ? 'Segundo' : p === 3 ? 'Verano' : 'Invierno'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <label htmlFor="paralelo-select" className="block text-sm font-medium text-secondary-700 mb-2">
                      Paralelo
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <select
                        id="paralelo-select"
                        value={selectedParalelo}
                        onChange={(e) => setSelectedParalelo(e.target.value)}
                        className="block w-full rounded-md border-secondary-300 py-2.5 pl-3 pr-10 text-secondary-900 hover:border-secondary-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm transition-all duration-150 bg-white shadow-sm hover:bg-secondary-50"
                      >
                        {['A', 'B', 'C', 'D', 'E'].map(p => (
                          <option key={p} value={p}>Paralelo {p}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              {materiasDisponibles.length > 0 ? (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {materiasDisponibles.map((materia) => (
                    <div
                      key={materia.id_materia}
                      className="p-3 border border-secondary-200 rounded-lg hover:bg-secondary-50 cursor-pointer"
                      onClick={() => handleAsignarMateria(materia.id_materia)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-secondary-900">{materia.nombre}</p>
                          <p className="text-sm text-secondary-600">
                            {materia.sigla} - Semestre {materia.semestre}
                          </p>
                        </div>
                        <Button size="sm">Asignar</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-secondary-500 text-center py-4">
                  No hay materias disponibles para asignar
                </p>
              )}
              
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="secondary" onClick={() => setShowAsignarModal(false)}>
                  Cancelar
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Botón cerrar */}
      <div className="flex justify-center sm:justify-end pt-4 sm:pt-6 pb-4 sm:pb-0">
        <Button onClick={onClose} className="w-full sm:w-auto">
          Cerrar
        </Button>
      </div>
    </div>
  );
};

export default DocenteDetalle;