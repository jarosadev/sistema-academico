import React from 'react';
import Button from '../ui/Button';

const InscripcionDetalle = ({ inscripcion, onClose, onCambiarEstado }) => {
  const handleChangeEstado = (nuevoEstado) => {
    onCambiarEstado(inscripcion, nuevoEstado);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Información de la Inscripción</h3>
        <p><strong>Estudiante:</strong> {inscripcion.estudiante_nombre} {inscripcion.estudiante_apellido}</p>
        <p><strong>Materia:</strong> {inscripcion.materia_nombre}</p>
        <p><strong>Gestión:</strong> {inscripcion.gestion}</p>
        <p><strong>Estado:</strong> {inscripcion.estado}</p>
      </div>

      <div className="flex space-x-3">
        {inscripcion.estado !== 'activa' && (
          <Button onClick={() => handleChangeEstado('activa')} variant="primary">
            Marcar como Activa
          </Button>
        )}
        {inscripcion.estado !== 'finalizada' && (
          <Button onClick={() => handleChangeEstado('finalizada')} variant="success">
            Marcar como Finalizada
          </Button>
        )}
        {inscripcion.estado !== 'anulada' && (
          <Button onClick={() => handleChangeEstado('anulada')} variant="danger">
            Marcar como Anulada
          </Button>
        )}
      </div>

      <div className="flex justify-end mt-6">
        <Button onClick={onClose} variant="secondary">
          Cerrar
        </Button>
      </div>
    </div>
  );
};

export default InscripcionDetalle;
