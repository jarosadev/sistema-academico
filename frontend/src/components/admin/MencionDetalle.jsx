import React from 'react';
import { Tag, Hash, BookOpen } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';

const MencionDetalle = ({ mencion, onClose }) => {
  const getEstadoColor = (activo) => {
    return activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto px-3 sm:px-0">
      {/* Header con información básica */}
      <Card className="bg-white rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-100 rounded-xl flex-shrink-0 flex items-center justify-center mx-auto sm:mx-0">
            <Tag className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <h2 className="text-xl sm:text-2xl font-bold text-secondary-900 break-words">
                {mencion.nombre}
              </h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium self-center sm:self-auto ${getEstadoColor(mencion.activo)}`}>
                {mencion.activo ? 'Activa' : 'Inactiva'}
              </span>
            </div>
            <div className="mt-3">
              <div>
                <p className="text-sm text-secondary-600">Código</p>
                <p className="font-medium">{mencion.id_mencion}</p>
              </div>
            </div>
            {mencion.descripcion && (
              <div className="mt-4">
                <p className="text-sm text-secondary-600">Descripción</p>
                <p className="mt-1 text-secondary-800 text-sm sm:text-base">{mencion.descripcion}</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Información adicional */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-semibold text-secondary-900">
                {mencion.materias_requeridas}
              </p>
              <p className="text-xs sm:text-sm text-secondary-600">Materias Requeridas</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
              <Hash className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-semibold text-secondary-900">
                {mencion.id_mencion}
              </p>
              <p className="text-xs sm:text-sm text-secondary-600">Código de Mención</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Botón cerrar */}
      <div className="flex justify-center sm:justify-end pt-4 sm:pt-6 pb-4 sm:pb-0">
        <Button onClick={onClose} className="w-full sm:w-auto">
          Cerrar
        </Button>
      </div>
    </div>
  );
};

export default MencionDetalle;