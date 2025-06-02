import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useFormValidation, commonRules } from '../../utils/validation';

const NotaForm = ({ nota, onSubmit, onCancel, isEdit = false }) => {
  const [inscripciones, setInscripciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    id_inscripcion: '',
    calificacion: 0,
    tipo_evaluacion: 'parcial1',
    id_docente: '',
    observaciones: ''
  });

  const validationRules = {
    id_inscripcion: [commonRules.required],
    calificacion: [
      commonRules.required,
      commonRules.min(0),
      commonRules.max(100)
    ],
    tipo_evaluacion: [commonRules.required],
    id_docente: [
      commonRules.required,
      (value) => {
        if (!/^[0-9]+$/.test(value)) {
          return 'El ID debe ser un número válido';
        }
        return null;
      }
    ]
  };

  const { validator, validateField, validate, getFieldError, hasFieldError } = useFormValidation(validationRules);

  useEffect(() => {
    if (isEdit && nota) {
      setFormData({
        id_inscripcion: nota.id_inscripcion || '',
        calificacion: nota.calificacion || 0,
        tipo_evaluacion: nota.tipo_evaluacion || 'parcial1',
        id_docente: nota.id_docente || '',
        observaciones: nota.observaciones || ''
      });
    }
  }, [isEdit, nota]);

  useEffect(() => {
    cargarInscripciones();
  }, []);

  const cargarInscripciones = async () => {
    try {
      setLoading(true);
      const response = await dataService.inscripciones.obtenerTodas({ estado: 'inscrito' });
      setInscripciones(response.data);
    } catch (error) {
      console.error('Error al cargar inscripciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    validateField(name, value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate(formData)) {
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inscripción */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Inscripción
          </label>
          <select
            name="id_inscripcion"
            value={formData.id_inscripcion}
            onChange={handleChange}
            className={`w-full h-12 px-4 py-3 text-base border ${
              hasFieldError('id_inscripcion') ? 'border-red-500' : 'border-secondary-300'
            } bg-white text-secondary-900 placeholder-secondary-400 rounded-lg focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500/20 transition-colors duration-200`}
            disabled={isEdit}
            required
          >
            <option value="">Seleccione una inscripción</option>
            {inscripciones.map(inscripcion => (
              <option key={inscripcion.id_inscripcion} value={inscripcion.id_inscripcion}>
                {inscripcion.estudiante_nombre} {inscripcion.estudiante_apellido} - {inscripcion.materia_nombre}
              </option>
            ))}
          </select>
          {getFieldError('id_inscripcion') && (
            <p className="mt-1 text-sm text-red-500">{getFieldError('id_inscripcion')}</p>
          )}
        </div>

        {/* Calificación */}
        <div>
          <Input
            label="Calificación"
            name="calificacion"
            type="number"
            value={formData.calificacion}
            onChange={handleChange}
            error={getFieldError('calificacion')}
            required
          />
        </div>

        {/* Tipo de Evaluación */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Tipo de Evaluación
          </label>
          <select
            name="tipo_evaluacion"
            value={formData.tipo_evaluacion}
            onChange={handleChange}
            className={`w-full h-12 px-4 py-3 text-base border ${
              hasFieldError('tipo_evaluacion') ? 'border-red-500' : 'border-secondary-300'
            } bg-white text-secondary-900 placeholder-secondary-400 rounded-lg focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500/20 transition-colors duration-200`}
            required
          >
            <option value="parcial1">Primer Parcial</option>
            <option value="parcial2">Segundo Parcial</option>
            <option value="final">Examen Final</option>
            <option value="segunda_instancia">Segunda Instancia</option>
          </select>
          {getFieldError('tipo_evaluacion') && (
            <p className="mt-1 text-sm text-red-500">{getFieldError('tipo_evaluacion')}</p>
          )}
        </div>

        {/* ID Docente */}
        <div>
          <Input
            label="ID Docente"
            name="id_docente"
            type="number"
            value={formData.id_docente}
            onChange={handleChange}
            error={getFieldError('id_docente')}
            required
          />
        </div>

        {/* Observaciones */}
        <div className="md:col-span-2">
          <Input
            label="Observaciones"
            name="observaciones"
            type="textarea"
            value={formData.observaciones}
            onChange={handleChange}
            error={getFieldError('observaciones')}
          />
        </div>
      </div>

      {/* Botones */}
      <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="w-full sm:w-auto"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="w-full sm:w-auto"
        >
          {isEdit ? 'Guardar Cambios' : 'Registrar Nota'}
        </Button>
      </div>
    </form>
  );
};

export default NotaForm;
