import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useFormValidation, commonRules } from '../../utils/validation';

const InscripcionForm = ({ inscripcion, onSubmit, onCancel, isEdit = false }) => {
  const [formData, setFormData] = useState({
    id_estudiante: '',
    id_materia: '',
    gestion: '',
    paralelo: 'A',
    estado: 'inscrito'
  });

  const validationRules = {
    id_estudiante: [
      commonRules.required,
      (value) => {
        if (!/^[0-9]+$/.test(value)) {
          return 'El ID debe ser un número válido';
        }
        return null;
      }
    ],
    id_materia: [
      commonRules.required,
      (value) => {
        if (!/^[0-9]+$/.test(value)) {
          return 'El ID debe ser un número válido';
        }
        return null;
      }
    ],
    gestion: [
      commonRules.required,
      (value) => {
        if (!/^[0-9]{4}-[12]$/.test(value)) {
          return 'La gestión debe tener el formato YYYY-1 o YYYY-2';
        }
        return null;
      }
    ],
    paralelo: [
      commonRules.required,
      (value) => {
        if (!/^[A-Z]$/.test(value)) {
          return 'El paralelo debe ser una letra mayúscula (A, B, C, etc.)';
        }
        return null;
      },
      commonRules.maxLength(1)
    ],
    estado: [commonRules.required]
  };

  const { validator, validateField, validate, getFieldError, hasFieldError } = useFormValidation(validationRules);

  useEffect(() => {
    if (isEdit && inscripcion) {
      setFormData({
        id_estudiante: inscripcion.id_estudiante || '',
        id_materia: inscripcion.id_materia || '',
        gestion: inscripcion.gestion || '',
        paralelo: inscripcion.paralelo || 'A',
        estado: inscripcion.estado || 'inscrito'
      });
    }
  }, [isEdit, inscripcion]);

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
        {/* Estudiante */}
        <div>
          <Input
            label="ID Estudiante"
            name="id_estudiante"
            value={formData.id_estudiante}
            onChange={handleChange}
            error={getFieldError('id_estudiante')}
            required
          />
        </div>

        {/* Materia */}
        <div>
          <Input
            label="ID Materia"
            name="id_materia"
            value={formData.id_materia}
            onChange={handleChange}
            error={getFieldError('id_materia')}
            required
          />
        </div>

        {/* Gestión */}
        <div>
          <Input
            label="Gestión"
            name="gestion"
            value={formData.gestion}
            onChange={handleChange}
            error={getFieldError('gestion')}
            required
          />
        </div>

        {/* Paralelo */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Paralelo
          </label>
          <select
            name="paralelo"
            value={formData.paralelo}
            onChange={handleChange}
            className={`w-full h-12 px-4 py-3 text-base border ${
              hasFieldError('paralelo') ? 'border-red-500' : 'border-secondary-300'
            } bg-white text-secondary-900 placeholder-secondary-400 rounded-lg focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500/20 transition-colors duration-200`}
            required
          >
            <option value="A">Paralelo A</option>
            <option value="B">Paralelo B</option>
            <option value="C">Paralelo C</option>
            <option value="D">Paralelo D</option>
            <option value="E">Paralelo E</option>
          </select>
          {getFieldError('paralelo') && (
            <p className="mt-1 text-sm text-red-500">{getFieldError('paralelo')}</p>
          )}
        </div>

        {/* Estado */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Estado
          </label>
          <select
            name="estado"
            value={formData.estado}
            onChange={handleChange}
            className={`w-full h-12 px-4 py-3 text-base border ${
              hasFieldError('estado') ? 'border-red-500' : 'border-secondary-300'
            } bg-white text-secondary-900 placeholder-secondary-400 rounded-lg focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500/20 transition-colors duration-200`}
            required
          >
            <option value="inscrito">Inscrito</option>
            <option value="aprobado">Aprobado</option>
            <option value="reprobado">Reprobado</option>
            <option value="abandonado">Abandonado</option>
          </select>
          {getFieldError('estado') && (
            <p className="mt-1 text-sm text-red-500">{getFieldError('estado')}</p>
          )}
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
          {isEdit ? 'Guardar Cambios' : 'Crear Inscripción'}
        </Button>
      </div>
    </form>
  );
};

export default InscripcionForm;
