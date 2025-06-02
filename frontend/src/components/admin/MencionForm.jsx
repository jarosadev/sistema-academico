import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useFormValidation, commonRules } from '../../utils/validation';

const MencionForm = ({ mencion, onSubmit, onCancel, isEdit = false }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    materias_requeridas: 0,
    activo: true
  });

  const validationRules = {
    nombre: [commonRules.required, commonRules.minLength(3)],
    descripcion: [commonRules.required, commonRules.minLength(10)],
    materias_requeridas: [commonRules.required, commonRules.min(0)]
  };

  const { validator, validateField, validate, getFieldError, hasFieldError } = useFormValidation(validationRules);

  useEffect(() => {
    if (isEdit && mencion) {
      setFormData({
        nombre: mencion.nombre || '',
        descripcion: mencion.descripcion || '',
        materias_requeridas: mencion.materias_requeridas || 0,
        activo: mencion.activo !== undefined ? mencion.activo : true
      });
    }
  }, [isEdit, mencion]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: fieldValue
    }));

    if (type !== 'checkbox') {
      validateField(name, fieldValue);
    }
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
        {/* Nombre */}
        <div>
          <Input
            label="Nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            error={getFieldError('nombre')}
            required
          />
        </div>

        {/* Descripción */}
        <div className="md:col-span-2">
          <Input
            label="Descripción"
            name="descripcion"
            type="textarea"
            value={formData.descripcion}
            onChange={handleChange}
            error={getFieldError('descripcion')}
            required
          />
        </div>

        {/* Materias Requeridas */}
        <div>
          <Input
            label="Materias Requeridas"
            name="materias_requeridas"
            type="number"
            value={formData.materias_requeridas}
            onChange={handleChange}
            error={getFieldError('materias_requeridas')}
            required
          />
        </div>

        {/* Activo */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Activo
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="activo"
              checked={formData.activo}
              onChange={handleChange}
              className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
            />
            <span className="text-secondary-700">Activo</span>
          </div>
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
          {isEdit ? 'Guardar Cambios' : 'Crear Mención'}
        </Button>
      </div>
    </form>
  );
};

export default MencionForm;
