import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, Phone, MapPin, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Alert from '../ui/Alert';
import { useFormValidation, commonRules } from '../../utils/validation';

const RegisterForm = () => {
  const { register, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    correo: '',
    password: '',
    confirmPassword: '',
    nombre: '',
    apellido: '',
    ci: '',
    fecha_nacimiento: '',
    direccion: '',
    telefono: '',
    id_mencion: '',
    roles: [3] // Por defecto rol estudiante
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [menciones, setMenciones] = useState([]);
  const [success, setSuccess] = useState(false);

  const { validator, validateField, validate, getFieldError, hasFieldError } = useFormValidation({
    correo: [commonRules.required, commonRules.email],
    password: [commonRules.required, commonRules.password],
    confirmPassword: [
      commonRules.required,
      (value) => {
        if (value !== formData.password) {
          return 'Las contraseñas no coinciden';
        }
        return true;
      }
    ],
    nombre: [commonRules.required, commonRules.name],
    apellido: [commonRules.required, commonRules.name],
    ci: [commonRules.required, commonRules.ci],
    fecha_nacimiento: [commonRules.required, commonRules.birthDate],
    telefono: [commonRules.phone],
    id_mencion: [commonRules.required]
  });

  // Cargar menciones al montar el componente
  useEffect(() => {
    const loadMenciones = async () => {
      try {
        const response = await dataService.menciones.getAll();
        if (response.success) {
          setMenciones(response.data);
        }
      } catch (error) {
        console.error('Error al cargar menciones:', error);
      }
    };

    loadMenciones();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Validar campo en tiempo real
    validateField(name, value);
    
    // Limpiar errores generales
    if (error) {
      clearError();
    }
    
    if (success) {
      setSuccess(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate(formData)) {
      return;
    }

    // Preparar datos para envío
    const { confirmPassword, ...submitData } = formData;
    submitData.id_mencion = parseInt(submitData.id_mencion);

    const result = await register(submitData);
    
    if (result.success) {
      setSuccess(true);
      setFormData({
        correo: '',
        password: '',
        confirmPassword: '',
        nombre: '',
        apellido: '',
        ci: '',
        fecha_nacimiento: '',
        direccion: '',
        telefono: '',
        id_mencion: '',
        roles: [3]
      });
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <Alert variant="success" className="mb-6">
            <div>
              <h3 className="font-medium">¡Registro exitoso!</h3>
              <p className="mt-1">
                Tu cuenta ha sido creada correctamente. Ahora puedes iniciar sesión.
              </p>
            </div>
          </Alert>
          
          <div className="text-center">
            <Link to="/login">
              <Button>
                Ir a Iniciar Sesión
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-secondary-900">Crear Cuenta</h2>
          <p className="text-secondary-600 mt-2">
            Regístrate en el Sistema Académico
          </p>
        </div>

        {error && (
          <Alert variant="error" className="mb-6" dismissible onDismiss={clearError}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información de cuenta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Correo Electrónico"
              type="email"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              placeholder="tu.correo@umsa.edu.bo"
              icon={<Mail />}
              error={getFieldError('correo')}
              required
            />

            <div className="relative">
              <Input
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Mínimo 8 caracteres"
                icon={<Lock />}
                error={getFieldError('password')}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-9 text-secondary-400 hover:text-secondary-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="relative">
            <Input
              label="Confirmar Contraseña"
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Repite tu contraseña"
              icon={<Lock />}
              error={getFieldError('confirmPassword')}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-9 text-secondary-400 hover:text-secondary-600"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Información personal */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-secondary-900 mb-4">Información Personal</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Nombre"
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Tu nombre"
                icon={<User />}
                error={getFieldError('nombre')}
                required
              />

              <Input
                label="Apellido"
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                placeholder="Tu apellido"
                icon={<User />}
                error={getFieldError('apellido')}
                required
              />

              <Input
                label="Cédula de Identidad"
                type="text"
                name="ci"
                value={formData.ci}
                onChange={handleChange}
                placeholder="12345678"
                error={getFieldError('ci')}
                required
              />

              <Input
                label="Fecha de Nacimiento"
                type="date"
                name="fecha_nacimiento"
                value={formData.fecha_nacimiento}
                onChange={handleChange}
                icon={<Calendar />}
                error={getFieldError('fecha_nacimiento')}
                required
              />

              <Input
                label="Teléfono"
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="70123456"
                icon={<Phone />}
                error={getFieldError('telefono')}
              />

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Mención <span className="text-red-500">*</span>
                </label>
                <select
                  name="id_mencion"
                  value={formData.id_mencion}
                  onChange={handleChange}
                  className={`input ${getFieldError('id_mencion') ? 'border-red-500' : ''}`}
                  required
                >
                  <option value="">Selecciona una mención</option>
                  {menciones.map((mencion) => (
                    <option key={mencion.id_mencion} value={mencion.id_mencion}>
                      {mencion.nombre}
                    </option>
                  ))}
                </select>
                {getFieldError('id_mencion') && (
                  <p className="text-sm text-red-600 mt-1">{getFieldError('id_mencion')}</p>
                )}
              </div>
            </div>

            <Input
              label="Dirección"
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              placeholder="Tu dirección completa"
              icon={<MapPin />}
              containerClassName="mt-6"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-secondary-600">
            ¿Ya tienes una cuenta?{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
