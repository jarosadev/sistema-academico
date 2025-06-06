import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';
import Button from '../ui/Button';
import Input from '../ui/Input';
import SearchableSelect from '../ui/SearchableSelect';
import { useFormValidation, commonRules } from '../../utils/validation';
import { notificationService } from '../../services/notificationService';

const NotaForm = ({ nota, onSubmit, onCancel, isEdit = false }) => {
  const [formData, setFormData] = useState({
    id_inscripcion: '',
    calificacion: 0,
    id_tipo_evaluacion: '',
    id_docente: '',
    observaciones: ''
  });

  const [loadingInscripciones, setLoadingInscripciones] = useState(false);
  const [inscripcionOptions, setInscripcionOptions] = useState([]);
  const [tiposEvaluacion, setTiposEvaluacion] = useState([]);
  const [loadingTiposEvaluacion, setLoadingTiposEvaluacion] = useState(false);

  const validationRules = {
    id_inscripcion: [commonRules.required],
    calificacion: [
      commonRules.required,
      commonRules.min(0),
      commonRules.max(100)
    ],
    id_tipo_evaluacion: [commonRules.required],
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

  // Load initial data when editing
  useEffect(() => {
    if (isEdit && nota) {
      setFormData({
        id_inscripcion: nota.id_inscripcion || '',
        calificacion: nota.calificacion || 0,
        id_tipo_evaluacion: nota.id_tipo_evaluacion || '',
        id_docente: nota.id_docente || '',
        observaciones: nota.observaciones || ''
      });
      console.log(nota)
      // Load tipos de evaluacion if we have id_materia
      if (nota.id_materia) {
        fetchTiposEvaluacion(nota.id_materia);
      }
    }
  }, [isEdit, nota]);

  // Load tipos de evaluacion when inscripcion changes or on initial load in edit mode
  useEffect(() => {
    if (formData.id_inscripcion) {
      const selectedInscripcion = inscripcionOptions.find(opt => opt.value === formData.id_inscripcion);
      if (selectedInscripcion?.id_materia) {
        fetchTiposEvaluacion(selectedInscripcion.id_materia);
      }
    }
  }, [formData.id_inscripcion, inscripcionOptions]);

  // Load tipos de evaluacion when inscripcion changes or on initial load in edit mode
  useEffect(() => {
    if (formData.id_inscripcion) {
      const selectedInscripcion = inscripcionOptions.find(opt => opt.value === formData.id_inscripcion);
      if (selectedInscripcion?.id_materia) {
        fetchTiposEvaluacion(selectedInscripcion.id_materia);
      }
    }
  }, [formData.id_inscripcion, inscripcionOptions]);

  const fetchInscripciones = async (search) => {
    setLoadingInscripciones(true);
    try {
      const params = {
        search: search || '',
        limit: 20,
        page: 1
      };
      const response = await dataService.inscripciones.obtenerTodas(params);
      if (response.success) {
        const options = response.data.map(inscripcion => ({
          value: inscripcion.id_inscripcion,
          label: `${inscripcion.estudiante_nombre} ${inscripcion.estudiante_apellido} - ${inscripcion.materia_nombre}`,
          id_materia: inscripcion.id_materia // Include id_materia in the option
        }));
        setInscripcionOptions(options);
      }
    } catch (error) {
      notificationService.error('Error al cargar inscripciones');
    } finally {
      setLoadingInscripciones(false);
    }
  };

  useEffect(() => {
    fetchInscripciones('');
  }, []);

  const fetchTiposEvaluacion = async (id_materia) => {
    setLoadingTiposEvaluacion(true);
    try {
      const response = await dataService.tiposEvaluacion.obtenerPorMateria(id_materia);
      if (response.success) {
        setTiposEvaluacion(response.data);
      }
    } catch (error) {
      notificationService.error('Error al cargar tipos de evaluación');
    } finally {
      setLoadingTiposEvaluacion(false);
    }
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'id_inscripcion' ? { id_tipo_evaluacion: '' } : {}) // Reset tipo_evaluacion when inscripcion changes
    }));
    validateField(name, value);

    // Handle tipos_evaluacion loading when inscripcion changes
    if (name === 'id_inscripcion' && value) {
      const selectedInscripcion = inscripcionOptions.find(opt => opt.value === value);
      if (selectedInscripcion?.id_materia) {
        await fetchTiposEvaluacion(selectedInscripcion.id_materia);
      }
    } else if (name === 'id_inscripcion') {
      setTiposEvaluacion([]); // Clear tipos_evaluacion when no inscripcion is selected
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
        {/* Inscripción */}
        <div className="md:col-span-2">
          
          <SearchableSelect
            label="Inscripción"
            name="id_inscripcion"
            value={formData.id_inscripcion}
            onChange={handleChange}
            options={inscripcionOptions}
            onSearch={fetchInscripciones}
            loading={loadingInscripciones}
            placeholder="Buscar inscripción..."
            noOptionsText="No se encontraron inscripciones"
            disabled={isEdit}
            required
          />
          {hasFieldError('id_inscripcion') && (
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
            name="id_tipo_evaluacion"
            value={formData.id_tipo_evaluacion}
            onChange={handleChange}
            className={`w-full h-12 px-4 py-3 text-base border ${
              hasFieldError('id_tipo_evaluacion') ? 'border-red-500' : 'border-secondary-300'
            } bg-white text-secondary-900 placeholder-secondary-400 rounded-lg focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500/20 transition-colors duration-200`}
            required
            disabled={!formData.id_inscripcion || loadingTiposEvaluacion}
          >
            <option value="">
              {loadingTiposEvaluacion 
                ? 'Cargando tipos de evaluación...' 
                : formData.id_inscripcion 
                  ? 'Seleccione tipo de evaluación'
                  : 'Primero seleccione una inscripción'
              }
            </option>
            {tiposEvaluacion.map(tipo => (
              <option key={tipo.id_tipo_evaluacion} value={tipo.id_tipo_evaluacion}>
                {tipo.nombre} ({tipo.porcentaje}%)
              </option>
            ))}
          </select>
          {hasFieldError('id_tipo_evaluacion') && (
            <p className="mt-1 text-sm text-red-500">{getFieldError('id_tipo_evaluacion')}</p>
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
