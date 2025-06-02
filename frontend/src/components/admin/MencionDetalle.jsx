import React from 'react';
import Button from '../ui/Button';

const MencionDetalle = ({ mencion, onClose }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Información de la Mención</h3>
        <p><strong>ID:</strong> {mencion.id_mencion}</p>
        <p><strong>Nombre:</strong> {mencion.nombre}</p>
        <p><strong>Descripción:</strong> {mencion.descripcion}</p>
        <p><strong>Materias Requeridas:</strong> {mencion.materias_requeridas}</p>
        <p><strong>Estado:</strong> {mencion.activo ? 'Activa' : 'Inactiva'}</p>
      </div>

      <div className="flex justify-end mt-6">
        <Button onClick={onClose} variant="secondary">
          Cerrar
        </Button>
      </div>
    </div>
  );
};

export default MencionDetalle;
