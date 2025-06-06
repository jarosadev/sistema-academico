import React from 'react';
import { User, BookOpen, Calendar, GraduationCap, ClipboardCheck } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';

const NotaDetalle = ({ nota, onClose }) => {

  console.log(nota);
  const formatearFecha = (fecha) => {
    if (!fecha) return 'No disponible';
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto px-3 sm:px-0">
      {/* Header con información básica */}
      <Card className="bg-white rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-100 rounded-xl flex-shrink-0 flex items-center justify-center mx-auto sm:mx-0">
            <ClipboardCheck className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <h2 className="text-xl sm:text-2xl font-bold text-secondary-900 break-words">
                {nota.estudiante_nombre} {nota.estudiante_apellido}
              </h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium self-center sm:self-auto ${
                parseFloat(nota.calificacion) >= 51 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {parseFloat(nota.calificacion) >= 51 ? 'Aprobado' : 'Reprobado'}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-sm text-secondary-600">Materia</p>
                <p className="font-medium">{nota.materia_nombre}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-600">Sigla</p>
                <p className="font-medium">{nota.materia_sigla}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-600">Tipo de Evaluación</p>
                <p className="font-medium">{nota.tipo_evaluacion_nombre}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-600">Calificación</p>
                <p className={`font-medium ${parseFloat(nota.calificacion) >= 51 ? 'text-green-600' : 'text-red-600'}`}>
                  {nota.calificacion}/100
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Detalles de la Evaluación */}
      <Card className="overflow-hidden">
        <div className="px-3 sm:px-4 py-3 border-b border-secondary-200">
          <h3 className="text-base sm:text-lg font-semibold text-secondary-900">Detalles de la Evaluación</h3>
        </div>
        <div className="p-3 sm:p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-secondary-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-secondary-600">Fecha de Registro</p>
                <p className="font-medium break-words">{formatearFecha(nota.fecha_registro)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-secondary-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-secondary-600">Docente</p>
                <p className="font-medium break-words">{nota.docente_nombre} {nota.docente_apellido}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <BookOpen className="w-5 h-5 text-secondary-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-secondary-600">Paralelo</p>
                <p className="font-medium break-words">{nota.paralelo}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <GraduationCap className="w-5 h-5 text-secondary-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-secondary-600">Gestión</p>
                <p className="font-medium break-words">{nota.gestion}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Observaciones */}
      {nota.observaciones && (
        <Card className="overflow-hidden">
          <div className="px-3 sm:px-4 py-3 border-b border-secondary-200">
            <h3 className="text-base sm:text-lg font-semibold text-secondary-900">Observaciones</h3>
          </div>
          <div className="p-3 sm:p-4">
            <p className="text-base text-secondary-600 whitespace-pre-wrap">
              {nota.observaciones}
            </p>
          </div>
        </Card>
      )}

      {/* Botón cerrar */}
      <div className="flex justify-center sm:justify-end pt-4 sm:pt-6 pb-4 sm:pb-0">
        <Button onClick={onClose} className="w-full sm:w-auto">
          Cerrar
        </Button>
      </div>
    </div>
  );
};

export default NotaDetalle;
