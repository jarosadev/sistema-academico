import React from 'react';
import { User, Book, ClipboardList, GraduationCap, Calendar, Award, BarChart3, FileText } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';

const InscripcionDetalle = ({ inscripcion, onClose, onCambiarEstado }) => {
  const handleChangeEstado = (nuevoEstado) => {
    if (window.confirm(`¿Está seguro de cambiar el estado a "${nuevoEstado}"?`)) {
      onCambiarEstado(inscripcion, nuevoEstado);
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'inscrito': return 'bg-blue-100 text-blue-800';
      case 'aprobado': return 'bg-green-100 text-green-800';
      case 'reprobado': return 'bg-red-100 text-red-800';
      case 'abandonado': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No disponible';
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  const formatearPeriodo = (periodo) => {
    const periodos = {
      '1': 'Primer Semestre',
      '2': 'Segundo Semestre',
      '3': 'Verano',
      '4': 'Invierno'
    };
    return periodos[periodo] || periodo;
  };

  const calcularPromedioNotas = () => {
    if (!inscripcion.notas || inscripcion.notas.length === 0) return 0;
    const suma = inscripcion.notas.reduce((acc, nota) => acc + parseFloat(nota.calificacion || 0), 0);
    return (suma / inscripcion.notas.length).toFixed(2);
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto px-3 sm:px-0">
      {/* Header con información principal */}
      <Card className="bg-white rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-100 rounded-xl flex-shrink-0 flex items-center justify-center mx-auto sm:mx-0">
            <ClipboardList className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <h2 className="text-xl sm:text-2xl font-bold text-secondary-900 break-words">
                {inscripcion.materia_nombre}
              </h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium self-center sm:self-auto ${getEstadoColor(inscripcion.estado)}`}>
                {inscripcion.estado.charAt(0).toUpperCase() + inscripcion.estado.slice(1)}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-sm text-secondary-600">Materia</p>
                <p className="font-medium">{inscripcion.materia_sigla}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-600">Estudiante</p>
                <p className="font-medium">{inscripcion.estudiante_nombre} {inscripcion.estudiante_apellido}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-600">Gestión</p>
                <p className="font-medium">{inscripcion.gestion}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-600">Periodo</p>
                <p className="font-medium">{formatearPeriodo(inscripcion.periodo)}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Estadísticas en cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
              <Book className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-semibold text-secondary-900">
                {inscripcion.semestre}
              </p>
              <p className="text-xs sm:text-sm text-secondary-600">Semestre</p>
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
                {calcularPromedioNotas()}
              </p>
              <p className="text-xs sm:text-sm text-secondary-600">Promedio</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-semibold text-secondary-900">
                {inscripcion.notas ? inscripcion.notas.length : 0}
              </p>
              <p className="text-xs sm:text-sm text-secondary-600">Evaluaciones</p>
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
                {inscripcion.paralelo}
              </p>
              <p className="text-xs sm:text-sm text-secondary-600">Paralelo</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Información del Estudiante */}
      <Card className="overflow-hidden">
        <div className="px-3 sm:px-4 py-3 border-b border-secondary-200">
          <h3 className="text-base sm:text-lg font-semibold text-secondary-900 flex items-center">
            <User className="w-5 h-5 text-secondary-600 mr-2" />
            Información del Estudiante
          </h3>
        </div>
        <div className="p-3 sm:p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-secondary-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-secondary-600">Nombre Completo</p>
                <p className="font-medium break-words">{inscripcion.estudiante_nombre} {inscripcion.estudiante_apellido}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-secondary-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-secondary-600">Carnet de Identidad</p>
                <p className="font-medium break-words">{inscripcion.estudiante_ci}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Award className="w-5 h-5 text-secondary-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-secondary-600">Estado Académico</p>
                <p className="font-medium break-words">{inscripcion.estado_academico}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Información de la Materia */}
      <Card className="overflow-hidden">
        <div className="px-3 sm:px-4 py-3 border-b border-secondary-200">
          <h3 className="text-base sm:text-lg font-semibold text-secondary-900 flex items-center">
            <Book className="w-5 h-5 text-secondary-600 mr-2" />
            Información de la Materia
          </h3>
        </div>
        <div className="p-3 sm:p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <Book className="w-5 h-5 text-secondary-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-secondary-600">Nombre de la Materia</p>
                <p className="font-medium break-words">{inscripcion.materia_nombre}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-secondary-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-secondary-600">Sigla</p>
                <p className="font-medium break-words">{inscripcion.materia_sigla}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Award className="w-5 h-5 text-secondary-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-secondary-600">Mención</p>
                <p className="font-medium break-words">{inscripcion.mencion_nombre}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-5 h-5 text-secondary-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-secondary-600">Semestre</p>
                <p className="font-medium break-words">{inscripcion.semestre}</p>
              </div>
            </div>
          </div>
          {inscripcion.materia_descripcion && (
            <div className="mt-4">
              <p className="text-sm text-secondary-600">Descripción</p>
              <p className="font-medium text-secondary-900 mt-1">{inscripcion.materia_descripcion}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Información del Docente */}
      <Card className="overflow-hidden">
        <div className="px-3 sm:px-4 py-3 border-b border-secondary-200">
          <h3 className="text-base sm:text-lg font-semibold text-secondary-900 flex items-center">
            <GraduationCap className="w-5 h-5 text-secondary-600 mr-2" />
            Información del Docente
          </h3>
        </div>
        <div className="p-3 sm:p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <GraduationCap className="w-5 h-5 text-secondary-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-secondary-600">Nombre del Docente</p>
                <p className="font-medium break-words">{inscripcion.docente_nombre} {inscripcion.docente_apellido}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Award className="w-5 h-5 text-secondary-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-secondary-600">Especialidad</p>
                <p className="font-medium break-words">{inscripcion.docente_especialidad}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Historial de Notas */}
      {inscripcion.notas && inscripcion.notas.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-3 sm:px-4 py-3 border-b border-secondary-200">
            <h3 className="text-base sm:text-lg font-semibold text-secondary-900 flex items-center">
              <BarChart3 className="w-5 h-5 text-secondary-600 mr-2" />
              Historial de Notas
            </h3>
          </div>
          <div className="p-3 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
              {inscripcion.notas.map((nota, index) => (
                <div key={nota.id_nota || index} className="bg-secondary-50 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-secondary-700">
                        {nota.tipo_evaluacion}
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
        </Card>
      )}

      {/* Acciones de Estado */}
      <Card className="overflow-hidden">
        <div className="px-3 sm:px-4 py-3 border-b border-secondary-200">
          <h3 className="text-base sm:text-lg font-semibold text-secondary-900">Cambiar Estado de Inscripción</h3>
        </div>
        <div className="p-3 sm:p-4">
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            {inscripcion.estado !== 'inscrito' && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleChangeEstado('inscrito')}
                className="flex-1 sm:flex-none"
              >
                Marcar como Inscrito
              </Button>
            )}
            {inscripcion.estado !== 'aprobado' && (
              <Button
                size="sm"
                variant="success"
                onClick={() => handleChangeEstado('aprobado')}
                className="flex-1 sm:flex-none"
              >
                Marcar como Aprobado
              </Button>
            )}
            {inscripcion.estado !== 'reprobado' && (
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleChangeEstado('reprobado')}
                className="flex-1 sm:flex-none"
              >
                Marcar como Reprobado
              </Button>
            )}
            {inscripcion.estado !== 'abandonado' && (
              <Button
                size="sm"
                variant="warning"
                onClick={() => handleChangeEstado('abandonado')}
                className="flex-1 sm:flex-none"
              >
                Marcar como Abandonado
              </Button>
            )}
          </div>
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

export default InscripcionDetalle;
