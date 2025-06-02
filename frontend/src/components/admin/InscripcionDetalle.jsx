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
        {inscripcion.estado !== 'inscrito' && (
          <Button onClick={() => handleChangeEstado('inscrito')} variant="primary">
            Marcar como Inscrito
          </Button>
        )}
        {inscripcion.estado !== 'aprobado' && (
          <Button onClick={() => handleChangeEstado('aprobado')} variant="success">
            Marcar como Aprobado
          </Button>
        )}
        {inscripcion.estado !== 'reprobado' && (
          <Button onClick={() => handleChangeEstado('reprobado')} variant="danger">
            Marcar como Reprobado
          </Button>
        )}
        {inscripcion.estado !== 'abandonado' && (
          <Button onClick={() => handleChangeEstado('abandonado')} variant="warning">
            Marcar como Abandonado
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
