import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Alert from '../ui/Alert';
import { useFormValidation, commonRules } from '../../utils/validation';

const LoginForm = () => {
  const { login, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    correo: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const { validateField, validate, getFieldError } = useFormValidation({
    correo: [commonRules.required, commonRules.email],
    password: [commonRules.required]
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Validar campo en tiempo real y mostrar error inmediatamente
    validateField(name, value, true);
    
    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar todos los campos y mostrar errores inmediatamente
    if (!validate(formData)) {
      // Forzar la validación de todos los campos
      Object.keys(formData).forEach(fieldName => {
        validateField(fieldName, formData[fieldName], true);
      });
      return;
    }

    const result = await login(formData);
    
    if (!result.success) {
      console.error('Error de login:', result.message);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-secondary-900">Iniciar Sesión</h2>
          <p className="text-secondary-600 mt-2">
            Accede a tu cuenta del Sistema Académico
          </p>
        </div>

        {error && (
          <Alert variant="error" className="mb-6" dismissible={false}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <Input
            label="Correo Electrónico"
            type="email"
            name="correo"
            value={formData.correo}
            onChange={handleChange}
            onBlur={(e) => validateField('correo', e.target.value, true)}
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
              onBlur={(e) => validateField('password', e.target.value, true)}
              placeholder="Ingresa tu contraseña"
              icon={<Lock />}
              error={getFieldError('password')}
              required
              inputClassName="pr-10"
            />
            <button
              type="button"
              className="absolute right-0 top-[34px] pr-3 h-[42px] flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5 text-secondary-400 hover:text-secondary-600" />
              ) : (
                <Eye className="w-5 h-5 text-secondary-400 hover:text-secondary-600" />
              )}
            </button>
          </div>

         
          <Button
            type="submit"
            className="w-full"
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-secondary-600">
            ¿No tienes una cuenta?{' '}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
