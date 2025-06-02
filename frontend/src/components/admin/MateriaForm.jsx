import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useFormValidation, commonRules } from '../../utils/validation';
import TiposEvaluacionList from './TiposEvaluacionList';

const MateriaForm = ({ materia, onSubmit, onCancel, menciones, isEdit = false }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    sigla: '',
    semestre: 1,
    id_mencion: '',
    descripcion: '',
    activo: true
  });

  const validationRules = {
    nombre: [
      commonRules.required,
      commonRules.minLength(3)
    ],
    sigla: [
      commonRules.required,
      (value) => {
        if (!/^[A-Z0-9-]+$/.test(value)) {
          return 'La sigla debe contener solo letras mayúsculas, números y guiones';
        }
        return null;
      },
      commonRules.maxLength(10)
    ],
    descripcion: [
      commonRules.required,
      commonRules.minLength(10)
    ],
    semestre: [
      commonRules.required,
      commonRules.min(1),
      commonRules.max(10)
    ],
    id_mencion: [commonRules.required]
  };

  const { validateField, validate, getFieldError, hasFieldError } = useFormValidation(validationRules);

  useEffect(() => {
    if (isEdit && materia) {
      setFormData({
        nombre: materia.nombre || '',
        sigla: materia.sigla || '',
        semestre: materia.semestre || 1,
        id_mencion: materia.id_mencion ? materia.id_mencion.toString() : '',
        descripcion: materia.descripcion || '',
        activo: materia.activo !== undefined ? materia.activo : true
      });
    }
  }, [isEdit, materia]);

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
    <div className="space-y-8">
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

        {/* Sigla */}
        <div>
          <Input
            label="Sigla"
            name="sigla"
            value={formData.sigla}
            onChange={handleChange}
            error={getFieldError('sigla')}
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

        {/* Semestre */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Semestre
          </label>
          <select
            name="semestre"
            value={formData.semestre}
            onChange={handleChange}
            className={`w-full h-12 px-4 py-3 text-base border ${
              hasFieldError('semestre') ? 'border-red-500' : 'border-secondary-300'
            } bg-white text-secondary-900 placeholder-secondary-400 rounded-lg focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500/20 transition-colors duration-200`}
            required
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(sem => (
              <option key={sem} value={sem}>
                Semestre {sem}
              </option>
            ))}
          </select>
          {getFieldError('semestre') && (
            <p className="mt-1 text-sm text-red-500">{getFieldError('semestre')}</p>
          )}
        </div>

        {/* Mención */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Mención
          </label>
          <select
            name="id_mencion"
            value={formData.id_mencion}
            onChange={handleChange}
            className={`w-full h-12 px-4 py-3 text-base border ${
              hasFieldError('id_mencion') ? 'border-red-500' : 'border-secondary-300'
            } bg-white text-secondary-900 placeholder-secondary-400 rounded-lg focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500/20 transition-colors duration-200`}
            required
          >
            <option value="">Seleccione una mención</option>
            {menciones.map(mencion => (
              <option key={mencion.id_mencion} value={mencion.id_mencion}>
                {mencion.nombre}
              </option>
            ))}
          </select>
          {getFieldError('id_mencion') && (
            <p className="mt-1 text-sm text-red-500">{getFieldError('id_mencion')}</p>
          )}
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
          {isEdit ? 'Guardar Cambios' : 'Crear Materia'}
        </Button>
      </div>
        </form>

      {/* Tipos de Evaluación - Solo mostrar en modo edición */}
      {isEdit && materia && materia.id_materia && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Tipos de Evaluación
          </h3>
          <div className="bg-white rounded-lg shadow p-6">
            <TiposEvaluacionList materiaId={materia.id_materia} />
          </div>
        </div>
      )}
    </div>
  );
};

export default MateriaForm;
