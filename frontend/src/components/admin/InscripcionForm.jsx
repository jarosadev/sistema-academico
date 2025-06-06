import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Select from '../ui/Select';
import SearchableSelect from '../ui/SearchableSelect';
import { useFormValidation, commonRules } from '../../utils/validation';
import { dataService } from '../../services/dataService';
import { notificationService } from '../../services/notificationService';

const InscripcionForm = ({ inscripcion, onSubmit, onCancel, isEdit = false }) => {
  const [formData, setFormData] = useState({
    id_estudiante: '',
    id_materia: '',
    gestion: '',
    periodo: '',
    paralelo: '',
    estado: 'inscrito'
  });

  // Loading states
  const [loading, setLoading] = useState({
    estudiantes: true,
    materias: true,
    paralelos: false
  });

  // Options for selects
  const [options, setOptions] = useState({
    estudiantes: [],
    materias: [],
    paralelos: [],
    gestiones: (() => {
      const currentYear = new Date().getFullYear();
      return [
        { value: currentYear.toString(), label: currentYear.toString() },
        { value: (currentYear - 1).toString(), label: (currentYear - 1).toString() },
        { value: (currentYear + 1).toString(), label: (currentYear + 1).toString() }
      ];
    })(),
    periodos: [
      { value: "1", label: "Primero" },
      { value: "2", label: "Segundo" },
      { value: "3", label: "Verano" },
      { value: "4", label: "Invierno" }
    ],
    estados: [
      { value: 'inscrito', label: 'Inscrito' },
      { value: 'aprobado', label: 'Aprobado' },
      { value: 'reprobado', label: 'Reprobado' },
      { value: 'abandonado', label: 'Abandonado' }
    ]
  });

  const validationRules = {
    id_estudiante: [commonRules.required],
    id_materia: [commonRules.required],
    gestion: [commonRules.required],
    paralelo: [commonRules.required],
    periodo: [commonRules.required],
    estado: [commonRules.required]
  };

  const { validator, validateField, validate, getFieldError } = useFormValidation(validationRules);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch estudiantes
        setLoading(prev => ({ ...prev, estudiantes: true }));
        const estudiantesRes = await dataService.estudiantes.obtenerTodos();
        setOptions(prev => ({
          ...prev,
          estudiantes: estudiantesRes.data.map(est => ({
            value: est.id_estudiante,
            label: `${est.apellido}, ${est.nombre} (${est.ci})`
          }))
        }));
      } catch (error) {
        notificationService.error('Error al cargar estudiantes');
      } finally {
        setLoading(prev => ({ ...prev, estudiantes: false }));
      }

      try {
        // Fetch materias
        setLoading(prev => ({ ...prev, materias: true }));
        const materiasRes = await dataService.materias.obtenerTodas();
        setOptions(prev => ({
          ...prev,
          materias: materiasRes.data.map(mat => ({
            value: mat.id_materia,
            label: `${mat.sigla} - ${mat.nombre}`
          }))
        }));
      } catch (error) {
        notificationService.error('Error al cargar materias');
      } finally {
        setLoading(prev => ({ ...prev, materias: false }));
      }
    };

    fetchData();
  }, []);

  // Fetch paralelos when materia is selected
  useEffect(() => {
    const fetchParalelos = async () => {
      if (!formData.id_materia) {
        setOptions(prev => ({ ...prev, paralelos: [] }));
        return;
      }

      try {
        setLoading(prev => ({ ...prev, paralelos: true }));
        const paralelosRes = await dataService.materias.obtenerParalelos(formData.id_materia);
        setOptions(prev => ({
          ...prev,
          paralelos: paralelosRes.data.map(p => ({
            value: p.paralelo,
            label: `Paralelo ${p.paralelo} - Prof. ${p.docente_nombre} ${p.docente_apellido}`
          }))
        }));

        // Reset paralelo if current selection is not available
        if (!paralelosRes.data.some(p => p.paralelo === formData.paralelo)) {
          setFormData(prev => ({ ...prev, paralelo: '' }));
        }
      } catch (error) {
        notificationService.error('Error al cargar paralelos');
      } finally {
        setLoading(prev => ({ ...prev, paralelos: false }));
      }
    };

    fetchParalelos();
  }, [formData.id_materia]);

  // Load initial data for edit mode
  useEffect(() => {
    if (isEdit && inscripcion) {
      setFormData({
        id_estudiante: inscripcion.id_estudiante || '',
        id_materia: inscripcion.id_materia || '',
        gestion: inscripcion.gestion || '',
        periodo: inscripcion.periodo ? inscripcion.periodo.toString() : '',
        paralelo: inscripcion.paralelo || '',
        estado: inscripcion.estado || 'inscrito'
      });
    }
  }, [isEdit, inscripcion]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate(formData)) return;
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Estudiante */}
        <div>
          <SearchableSelect
            label="Estudiante"
            name="id_estudiante"
            value={formData.id_estudiante}
            onChange={handleChange}
            options={options.estudiantes}
            error={getFieldError('id_estudiante')}
            loading={loading.estudiantes}
            required
            placeholder="Buscar estudiante..."
            noOptionsText="No se encontraron estudiantes"
          />
        </div>

        {/* Materia */}
        <div>
          <SearchableSelect
            label="Materia"
            name="id_materia"
            value={formData.id_materia}
            onChange={handleChange}
            options={options.materias}
            error={getFieldError('id_materia')}
            loading={loading.materias}
            required
            placeholder="Buscar materia..."
            noOptionsText="No se encontraron materias"
          />
        </div>

        {/* Gestión */}
        <div>
          <Select
            label="Gestión"
            name="gestion"
            value={formData.gestion}
            onChange={handleChange}
            error={getFieldError('gestion')}
            required
          >
            <option value="">Seleccione gestión</option>
            {options.gestiones.map(gestion => (
              <option key={gestion.value} value={gestion.value}>
                {gestion.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Paralelo */}
        <div>
          <Select
            label="Paralelo"
            name="paralelo"
            value={formData.paralelo}
            onChange={handleChange}
            error={getFieldError('paralelo')}
            disabled={!formData.id_materia || loading.paralelos}
            required
          >
            <option value="">Seleccione paralelo</option>
            {options.paralelos.map(paralelo => (
              <option key={paralelo.value} value={paralelo.value}>
                {paralelo.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Estado */}
        <div>
          <Select
            label="Estado"
            name="estado"
            value={formData.estado}
            onChange={handleChange}
            error={getFieldError('estado')}
            required
          >
            {options.estados.map(estado => (
              <option key={estado.value} value={estado.value}>
                {estado.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Periodo */}
        <div>
          <Select
            label="Periodo"
            name="periodo"
            value={formData.periodo}
            onChange={handleChange}
            error={getFieldError('periodo')}
            required
          >
            <option value="">Seleccione periodo</option>
            {options.periodos.map(periodo => (
              <option key={periodo.value} value={periodo.value}>
                {periodo.label}
              </option>
            ))}
          </Select>
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
          disabled={loading.estudiantes || loading.materias || loading.paralelos}
        >
          {isEdit ? 'Guardar Cambios' : 'Crear Inscripción'}
        </Button>
      </div>
    </form>
  );
};

export default InscripcionForm;
