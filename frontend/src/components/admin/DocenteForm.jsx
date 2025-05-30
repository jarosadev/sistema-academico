import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Briefcase, Calendar, Lock } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useFormValidation, commonRules } from '../../utils/validation';

const DocenteForm = ({ docente, onSubmit, onCancel, isEdit = false }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    ci: '',
    especialidad: '',
    telefono: '',
    correo: '',
    password: '',
    fecha_contratacion: '',
    activo: true
  });

  const [loading, setLoading] = useState(false);

  // Reglas de validación
  const validationRules = {
    nombre: [commonRules.required, commonRules.minLength(2)],
    apellido: [commonRules.required, commonRules.minLength(2)],
    ci: [commonRules.required, commonRules.minLength(7)],
    especialidad: [commonRules.required, commonRules.minLength(3)],
    telefono: [commonRules.required, commonRules.phone],
    correo: [commonRules.required, commonRules.email],
    fecha_contratacion: [commonRules.required],
    ...(isEdit ? {} : { password: [commonRules.required, commonRules.minLength(6)] })
  };

  const { validator, validateField, validate, getFieldError, hasFieldError } = useFormValidation(validationRules);

  // Cargar datos del docente si es edición
  useEffect(() => {
    if (isEdit && docente) {
      setFormData({
        nombre: docente.nombre || '',
        apellido: docente.apellido || '',
        ci: docente.ci || '',
        especialidad: docente.especialidad || '',
        telefono: docente.telefono || '',
        correo: docente.correo || '',
        password: '', // No mostrar password en edición
        fecha_contratacion: docente.fecha_contratacion ? docente.fecha_contratacion.split('T')[0] : '',
        activo: docente.activo !== undefined ? docente.activo : true
      });
    }
  }, [isEdit, docente]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: fieldValue
    }));
    
    // Validar campo en tiempo real (excepto checkbox)
    if (type !== 'checkbox') {
      validateField(name, fieldValue);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate(formData)) {
      return;
    }

    setLoading(true);
    try {
      // Si es edición, no enviar password si está vacío
      const dataToSubmit = { ...formData };
      if (isEdit && !dataToSubmit.password) {
        delete dataToSubmit.password;
      }
      
      await onSubmit(dataToSubmit);
    } catch (error) {
      console.error('Error en formulario:', error);
    } finally {
      setLoading(false);
    }
  };

  // Lista de especialidades comunes
  const especialidadesComunes = [
    'Ingeniería de Sistemas',
    'Ingeniería Industrial',
    'Ingeniería Civil',
    'Ingeniería Electrónica',
    'Ingeniería Mecánica',
    'Matemáticas',
    'Física',
    'Química',
    'Estadística',
    'Economía',
    'Administración',
    'Contabilidad',
    'Derecho',
    'Psicología',
    'Sociología',
    'Historia',
    'Filosofía',
    'Literatura',
    'Idiomas'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Información Personal */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-secondary-900 border-b pb-2">
            Información Personal
          </h3>
          
          <Input
            label="Nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Ingrese el nombre"
            icon={<User />}
            error={getFieldError('nombre')}
            required
          />

          <Input
            label="Apellido"
            name="apellido"
            value={formData.apellido}
            onChange={handleChange}
            placeholder="Ingrese el apellido"
            icon={<User />}
            error={getFieldError('apellido')}
            required
          />

          <Input
            label="Carnet de Identidad"
            name="ci"
            value={formData.ci}
            onChange={handleChange}
            placeholder="Ingrese el CI"
            error={getFieldError('ci')}
            required
            disabled={isEdit} // No permitir cambiar CI en edición
          />

          <Input
            label="Teléfono"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            placeholder="Ingrese el teléfono"
            icon={<Phone />}
            error={getFieldError('telefono')}
            required
          />

          <Input
            label="Correo Electrónico"
            name="correo"
            type="email"
            value={formData.correo}
            onChange={handleChange}
            placeholder="correo@umsa.edu.bo"
            icon={<Mail />}
            error={getFieldError('correo')}
            required
            disabled={isEdit} // No permitir cambiar correo en edición
          />
        </div>

        {/* Información Profesional */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-secondary-900 border-b pb-2">
            Información Profesional
          </h3>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary-700">
              Especialidad <span className="text-red-500">*</span>
            </label>
            <select
              name="especialidad"
              value={formData.especialidad}
              onChange={handleChange}
              className={`w-full h-12 px-4 py-3 text-base border border-secondary-300 bg-white text-secondary-900 placeholder-secondary-400 rounded-lg focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500/20 transition-colors duration-200 ${hasFieldError('especialidad') ? 'border-red-500' : ''}`}
              required
            >
              <option value="">Seleccione una especialidad</option>
              {especialidadesComunes.map(esp => (
                <option key={esp} value={esp}>
                  {esp}
                </option>
              ))}
            </select>
            {getFieldError('especialidad') && (
              <p className="text-sm text-red-600">{getFieldError('especialidad')}</p>
            )}
          </div>

          <Input
            label="Fecha de Contratación"
            name="fecha_contratacion"
            type="date"
            value={formData.fecha_contratacion}
            onChange={handleChange}
            icon={<Calendar />}
            error={getFieldError('fecha_contratacion')}
            required
          />

          <Input
            label={isEdit ? "Nueva Contraseña (opcional)" : "Contraseña"}
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder={isEdit ? "Dejar vacío para mantener actual" : "Ingrese la contraseña"}
            icon={<Lock />}
            error={getFieldError('password')}
            required={!isEdit}
            helperText={isEdit ? "Solo complete si desea cambiar la contraseña" : "Mínimo 6 caracteres"}
          />

          {isEdit && (
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="activo"
                name="activo"
                checked={formData.activo}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
              />
              <label htmlFor="activo" className="text-sm font-medium text-secondary-700">
                Docente activo
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-secondary-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-secondary-900 mb-2">Información Importante</h4>
        <ul className="text-sm text-secondary-600 space-y-1">
          <li>• El docente podrá acceder al sistema con el correo y contraseña proporcionados</li>
          <li>• La especialidad ayudará en la asignación de materias apropiadas</li>
          <li>• La fecha de contratación se usa para reportes y estadísticas</li>
          {isEdit && <li>• Los cambios en CI y correo requieren validación adicional</li>}
        </ul>
      </div>

      {/* Botones */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={loading}
          disabled={loading}
        >
          {isEdit ? 'Actualizar Docente' : 'Crear Docente'}
        </Button>
      </div>
    </form>
  );
};

export default DocenteForm;
