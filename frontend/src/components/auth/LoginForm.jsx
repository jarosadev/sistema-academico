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

  const { validator, validateField, validate, getFieldError, hasFieldError } = useFormValidation({
    correo: [commonRules.required, commonRules.email],
    password: [commonRules.required]
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Validar campo en tiempo real
    validateField(name, value);
    
    // Limpiar error cuando se modifica un campo
    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate(formData)) {
      return;
    }

    const result = await login(formData);
    
    if (!result.success) {
      // El error ya se maneja en el contexto y se muestra en el alert
      console.error('Error de login:', result.message);
      // No limpiar el error hasta que el usuario modifique un campo o envíe de nuevo
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

        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-secondary-900">
                Recordarme
              </label>
            </div>

            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
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
