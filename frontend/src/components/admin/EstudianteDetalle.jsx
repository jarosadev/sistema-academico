import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, GraduationCap, BookOpen, Award, Clock, BarChart3 } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Loading from '../ui/Loading';
import { dataService } from '../../services/dataService';

const EstudianteDetalle = ({ estudiante, onClose, onCambiarEstado }) => {
  const [inscripciones, setInscripciones] = useState([]);
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatosAdicionales();
  }, [estudiante.id_estudiante]);

  const cargarDatosAdicionales = async () => {
    try {
      setLoading(true);
      const [inscripcionesRes, notasRes] = await Promise.all([
        dataService.estudiantes.getInscripciones(estudiante.id_estudiante).catch(() => ({ data: [] })),
        dataService.estudiantes.getNotas(estudiante.id_estudiante).catch(() => ({ data: [] }))
      ]);
      
      setInscripciones(inscripcionesRes.data || []);
      setNotas(notasRes.data || []);
    } catch (error) {
      console.error('Error al cargar datos adicionales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarEstado = (nuevoEstado) => {
    if (window.confirm(`¿Está seguro de cambiar el estado a "${nuevoEstado}"?`)) {
      onCambiarEstado(estudiante, nuevoEstado);
    }
  };

  // Calcular promedio general ponderado
  const calcularPromedioGeneral = () => {
    if (notas.length === 0) return 0;
    
    const materias = agruparNotasPorMateria();
    if (materias.length === 0) return 0;
    
    const sumaPromedios = materias.reduce((suma, materia) => {
      const promedio = materia.porcentaje_completado >= 100 
        ? materia.promedio_ponderado 
        : materia.promedio_parcial;
      return suma + parseFloat(promedio || 0);
    }, 0);
    
    return (sumaPromedios / materias.length).toFixed(2);
  };

  const calcularEdad = () => {
    if (!estudiante.fecha_nacimiento) return 0;
    const today = new Date();
    const birthDate = new Date(estudiante.fecha_nacimiento);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const calcularAnosEstudio = () => {
    if (!estudiante.fecha_ingreso) return 0;
    return Math.floor((new Date() - new Date(estudiante.fecha_ingreso)) / (365.25 * 24 * 60 * 60 * 1000));
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No disponible';
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'activo': return 'bg-green-100 text-green-800';
      case 'graduado': return 'bg-blue-100 text-blue-800';
      case 'suspendido': return 'bg-red-100 text-red-800';
      case 'inactivo': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Agrupar notas por inscripción/materia con cálculo ponderado
  const agruparNotasPorMateria = () => {
    const notasAgrupadas = {};
    
    notas.forEach(nota => {
      const key = `${nota.id_inscripcion}`;
      if (!notasAgrupadas[key]) {
        notasAgrupadas[key] = {
          id_inscripcion: nota.id_inscripcion,
          materia_nombre: nota.materia_nombre,
          materia_sigla: nota.materia_sigla,
          gestion: nota.gestion,
          periodo: nota.periodo,
          notas: [],
          promedio_ponderado: 0,
          promedio_parcial: 0,
          porcentaje_completado: 0
        };
      }
      notasAgrupadas[key].notas.push(nota);
    });

    // Calcular promedio ponderado para cada materia
    Object.keys(notasAgrupadas).forEach(key => {
      const materia = notasAgrupadas[key];
      let sumaCalificacionesPonderadas = 0;
      let sumaPorcentajes = 0;

      materia.notas.forEach(nota => {
        const porcentaje = parseFloat(nota.tipo_evaluacion_porcentaje) || 0;
        const calificacion = parseFloat(nota.calificacion) || 0;
        
        // Calcular la nota real basada en el porcentaje
        const notaReal = (calificacion * porcentaje) / 100;
        sumaCalificacionesPonderadas += notaReal;
        sumaPorcentajes += porcentaje;
      });

      materia.promedio_ponderado = sumaCalificacionesPonderadas.toFixed(2);
      materia.porcentaje_completado = sumaPorcentajes;
      
      // Si no se ha completado el 100% de evaluaciones, mostrar el promedio parcial
      if (sumaPorcentajes > 0) {
        materia.promedio_parcial = ((sumaCalificacionesPonderadas / sumaPorcentajes) * 100).toFixed(2);
      } else {
        materia.promedio_parcial = 0;
      }
    });

    return Object.values(notasAgrupadas);
  };

  const getTipoEvaluacionNombre = (tipoId) => {
    const tipos = {
      1: 'Primer Parcial',
      2: 'Segundo Parcial', 
      3: 'Examen Final',
      4: 'Recuperatorio'
    };
    return tipos[tipoId] || `Evaluación ${tipoId}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loading />
      </div>
    );
  }

  const notasAgrupadas = agruparNotasPorMateria();

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
                {estudiante.nombre} {estudiante.apellido}
              </h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium self-center sm:self-auto ${getEstadoColor(estudiante.estado_academico)}`}>
                {estudiante.estado_academico}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-sm text-secondary-600">CI</p>
                <p className="font-medium">{estudiante.ci}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-600">Mención</p>
                <p className="font-medium">{estudiante.mencion_nombre || 'No asignada'}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-600">Correo</p>
                <p className="font-medium text-sm break-all">{estudiante.correo}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-600">Teléfono</p>
                <p className="font-medium">{estudiante.telefono || 'No disponible'}</p>
              </div>
            </div>
            
            {/* Botones de acción */}
            <div className="mt-4 flex flex-wrap gap-2 justify-center sm:justify-start">
              {estudiante.estado_academico === 'activo' && (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleCambiarEstado('suspendido')}
                    className="flex-1 sm:flex-none"
                  >
                    Suspender
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleCambiarEstado('graduado')}
                    className="flex-1 sm:flex-none"
                  >
                    Graduar
                  </Button>
                </>
              )}
              {estudiante.estado_academico === 'suspendido' && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleCambiarEstado('activo')}
                  className="flex-1 sm:flex-none"
                >
                  Reactivar
                </Button>
              )}
              {estudiante.estado_academico === 'inactivo' && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleCambiarEstado('activo')}
                  className="flex-1 sm:flex-none"
                >
                  Activar
                </Button>
              )}
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
                {inscripciones.length}
              </p>
              <p className="text-xs sm:text-sm text-secondary-600">Materias Inscritas</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-semibold text-secondary-900">
                {calcularPromedioGeneral()}
              </p>
              <p className="text-xs sm:text-sm text-secondary-600">Promedio General</p>
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
                {calcularEdad()}
              </p>
              <p className="text-xs sm:text-sm text-secondary-600">Años de Edad</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-semibold text-secondary-900">
                {calcularAnosEstudio()}
              </p>
              <p className="text-xs sm:text-sm text-secondary-600">Años de Estudio</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Información Personal */}
      <Card className="overflow-hidden">
        <div className="px-3 sm:px-4 py-3 border-b border-secondary-200">
          <h3 className="text-base sm:text-lg font-semibold text-secondary-900">Información Personal</h3>
        </div>
        <div className="p-3 sm:p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-secondary-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-secondary-600">Fecha de Nacimiento</p>
                <p className="font-medium break-words">{formatearFecha(estudiante.fecha_nacimiento)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-secondary-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-secondary-600">Dirección</p>
                <p className="font-medium break-words">{estudiante.direccion || 'No disponible'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-secondary-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-secondary-600">Fecha de Ingreso</p>
                <p className="font-medium break-words">{formatearFecha(estudiante.fecha_ingreso)}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Lista de Inscripciones */}
      <Card className="overflow-hidden">
        <div className="px-3 sm:px-4 py-3 border-b border-secondary-200">
          <h3 className="text-base sm:text-lg font-semibold text-secondary-900">Inscripciones</h3>
        </div>
        <div className="divide-y divide-secondary-200">
          {inscripciones.length > 0 ? (
            inscripciones.map((inscripcion, index) => (
              <div key={index} className="p-3 sm:p-4 hover:bg-secondary-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm sm:text-base font-medium text-secondary-900 break-words">
                      {inscripcion.materia_nombre}
                    </h4>
                    <div className="flex flex-wrap gap-2 mt-1 text-xs sm:text-sm text-secondary-600">
                      <span>{inscripcion.materia_sigla}</span>
                      <span>•</span>
                      <span>Gestión {inscripcion.gestion}</span>
                      <span>•</span>
                      <span>Periodo {inscripcion.periodo}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      inscripcion.estado === 'activa' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {inscripcion.estado}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-secondary-600">
              <p className="text-sm sm:text-base">No hay inscripciones registradas</p>
            </div>
          )}
        </div>
      </Card>

      {/* Historial de Notas Agrupado */}
      <Card className="overflow-hidden">
        <div className="px-3 sm:px-4 py-3 border-b border-secondary-200">
          <h3 className="text-base sm:text-lg font-semibold text-secondary-900">Historial de Notas</h3>
        </div>
        <div className="divide-y divide-secondary-200">
          {notasAgrupadas.length > 0 ? (
            notasAgrupadas.map((materia, index) => (
              <div key={index} className="p-3 sm:p-4">
                <div className="mb-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-2 sm:space-y-0">
                    <div className="flex-1">
                      <h4 className="text-sm sm:text-base font-medium text-secondary-900 break-words">
                        {materia.materia_nombre}
                      </h4>
                      <div className="flex flex-wrap gap-2 mt-1 text-xs sm:text-sm text-secondary-600">
                        <span>{materia.materia_sigla}</span>
                        <span>•</span>
                        <span>Gestión {materia.gestion}</span>
                        <span>•</span>
                        <span>Periodo {materia.periodo}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex flex-col items-end space-y-1">
                        <div>
                          <p className="text-xs text-secondary-600">
                            {materia.porcentaje_completado >= 100 ? 'Promedio Final' : 'Promedio Parcial'}
                          </p>
                          <p className={`text-lg font-semibold ${
                            parseFloat(materia.porcentaje_completado >= 100 
                              ? materia.promedio_ponderado 
                              : materia.promedio_parcial) >= 51 
                              ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {materia.porcentaje_completado >= 100 
                              ? materia.promedio_ponderado 
                              : materia.promedio_parcial}
                          </p>
                        </div>
                        <div className="text-xs text-secondary-500">
                          {materia.porcentaje_completado}% completado
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
                  {materia.notas.map((nota, notaIndex) => (
                    <div key={notaIndex} className="bg-secondary-50 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-secondary-700">
                            {nota.tipo_evaluacion_nombre || getTipoEvaluacionNombre(nota.id_tipo_evaluacion)}
                          </p>
                          <p className="text-xs text-secondary-500 mt-1">
                            {nota.tipo_evaluacion_porcentaje}% del total
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ml-2 ${
                          parseFloat(nota.calificacion) >= 51 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {parseFloat(nota.calificacion) >= 51 ? 'Aprobado' : 'Reprobado'}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <p className={`text-lg font-semibold ${
                          parseFloat(nota.calificacion) >= 51 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {nota.calificacion}/100
                        </p>
                        <p className="text-xs text-secondary-500">
                          Contribuye: {((parseFloat(nota.calificacion) * parseFloat(nota.tipo_evaluacion_porcentaje)) / 100).toFixed(2)} pts
                        </p>
                        <p className="text-xs text-secondary-500">
                          {formatearFecha(nota.fecha_registro)}
                        </p>
                        {nota.observaciones && (
                          <p className="text-xs text-secondary-600 mt-1">
                            {nota.observaciones}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-secondary-600">
              <p className="text-sm sm:text-base">No hay notas registradas</p>
            </div>
          )}
        </div>
      </Card>

      {/* Botón cerrar */}
      <div className="flex justify-center sm:justify-end pt-4 sm:pt-6 pb-4 sm:pb-0">
        <Button onClick={onClose} className="w-full sm:w-auto">
          Cerrar
        </Button>
      </div>
    </div>
  );
};

export default EstudianteDetalle;