import React from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';

const NotaDetalle = ({ nota, onClose }) => {
  const isAprobado = nota.calificacion >= 51;

  return (
    <div className="space-y-6">
      {/* Información del Estudiante y Materia */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Información del Estudiante</h3>
          <p><strong>Nombre:</strong> {nota.estudiante_nombre} {nota.estudiante_apellido}</p>
          <p><strong>CI:</strong> {nota.estudiante_ci}</p>
          <p><strong>Mención:</strong> {nota.mencion_nombre}</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Información de la Materia</h3>
          <p><strong>Materia:</strong> {nota.materia_nombre}</p>
          <p><strong>Código:</strong> {nota.materia_sigla}</p>
          <p><strong>Gestión:</strong> {nota.gestion}</p>
        </div>
      </div>

      {/* Calificación */}
      <div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Calificación</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className={`p-4 ${isAprobado ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Calificación</p>
                <p className={`text-2xl font-bold ${
                  isAprobado ? 'text-green-600' : 'text-red-600'
                }`}>
                  {nota.calificacion}
                </p>
              </div>
              <p className={`text-sm font-medium ${
                isAprobado ? 'text-green-600' : 'text-red-600'
              }`}>
                {isAprobado ? 'Aprobado' : 'Reprobado'}
              </p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Tipo de Evaluación</p>
                <p className="text-secondary-900">
                  {nota.tipo_evaluacion === 'parcial1' && 'Primer Parcial'}
                  {nota.tipo_evaluacion === 'parcial2' && 'Segundo Parcial'}
                  {nota.tipo_evaluacion === 'final' && 'Examen Final'}
                  {nota.tipo_evaluacion === 'segunda_instancia' && 'Segunda Instancia'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Observaciones */}
      {nota.observaciones && (
        <div>
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Observaciones</h3>
          <p className="text-secondary-700">{nota.observaciones}</p>
        </div>
      )}

      {/* Botón de cerrar */}
      <div className="flex justify-end mt-6">
        <Button onClick={onClose} variant="secondary">
          Cerrar
        </Button>
      </div>
    </div>
  );
};

export default NotaDetalle;
