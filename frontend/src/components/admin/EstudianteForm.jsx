import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, GraduationCap, Lock } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useFormValidation, commonRules } from '../../utils/validation';

const EstudianteForm = ({ estudiante, onSubmit, onCancel, menciones = [], isEdit = false }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    ci: '',
    fecha_nacimiento: '',
    direccion: '',
    telefono: '',
    correo: '',
    password: '',
    id_mencion: '',
    estado_academico: 'activo'
  });

  const [loading, setLoading] = useState(false);

  // Reglas de validación
  const validationRules = {
    nombre: [commonRules.required, commonRules.minLength(2)],
    apellido: [commonRules.required, commonRules.minLength(2)],
    ci: [commonRules.required, commonRules.minLength(7)],
    fecha_nacimiento: [commonRules.required],
    direccion: [commonRules.required],
    telefono: [commonRules.required, commonRules.phone],
    correo: [commonRules.required, commonRules.email],
    id_mencion: [commonRules.required],
    ...(isEdit ? {} : { password: [commonRules.required, commonRules.minLength(6)] })
  };

  const { validator, validateField, validate, getFieldError, hasFieldError } = useFormValidation(validationRules);

  // Cargar datos del estudiante si es edición
  useEffect(() => {
    if (isEdit && estudiante) {
      setFormData({
        nombre: estudiante.nombre || '',
        apellido: estudiante.apellido || '',
        ci: estudiante.ci || '',
        fecha_nacimiento: estudiante.fecha_nacimiento ? estudiante.fecha_nacimiento.split('T')[0] : '',
        direccion: estudiante.direccion || '',
        telefono: estudiante.telefono || '',
        correo: estudiante.correo || '',
        password: '', // No mostrar password en edición
        id_mencion: estudiante.id_mencion || '',
        estado_academico: estudiante.estado_academico || 'activo'
      });
    }
  }, [isEdit, estudiante]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Validar campo en tiempo real
    validateField(name, value);
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
            label="Fecha de Nacimiento"
            name="fecha_nacimiento"
            type="date"
            value={formData.fecha_nacimiento}
            onChange={handleChange}
            icon={<Calendar />}
            error={getFieldError('fecha_nacimiento')}
            required
          />

          <Input
            label="Dirección"
            name="direccion"
            value={formData.direccion}
            onChange={handleChange}
            placeholder="Ingrese la dirección"
            icon={<MapPin />}
            error={getFieldError('direccion')}
            required
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

          {/* Espacio vacío para alineación cuando es edición */}
          
        </div>

        {/* Información Académica */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-secondary-900 border-b pb-2">
            Información Académica
          </h3>

          <div className="space-y-2 pb-0.5">
            <label className="block text-sm font-medium text-secondary-700">
              Mención <span className="text-red-500">*</span>
            </label>
            <select
              name="id_mencion"
              value={formData.id_mencion}
              onChange={handleChange}
              className={`w-full h-12 px-4 py-3  text-base border border-secondary-300 bg-white text-secondary-900 placeholder-secondary-400 rounded-lg focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500/20 transition-colors duration-200 ${hasFieldError('id_mencion') ? 'border-red-500' : ''}`}
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
              <p className="text-sm text-red-600">{getFieldError('id_mencion')}</p>
            )}
          </div>

          {isEdit && (
            <div className="space-y-2 pb-0.5">
              <label className="block text-sm font-medium text-secondary-700">
                Estado Académico
              </label>
              <select
                name="estado_academico"
                value={formData.estado_academico}
                onChange={handleChange}
                className="input w-full h-12 px-4 py-3 text-base border border-secondary-300 bg-white text-secondary-900 placeholder-secondary-400 rounded-lg focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500/20 transition-colors duration-200"
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="graduado">Graduado</option>
                <option value="suspendido">Suspendido</option>
              </select>
            </div>
          )}

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
        </div>
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
          {isEdit ? 'Actualizar Estudiante' : 'Crear Estudiante'}
        </Button>
      </div>
    </form>
  );
};

export default EstudianteForm;
