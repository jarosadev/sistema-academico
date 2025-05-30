import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Alert from '../ui/Alert';
import { useFormValidation, commonRules } from '../../utils/validation';

const ChangePasswordForm = ({ onSuccess, onCancel }) => {
  const { changePassword } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { validator, validateField, validate, getFieldError } = useFormValidation({
    currentPassword: [commonRules.required],
    newPassword: [commonRules.required, commonRules.password],
    confirmPassword: [
      commonRules.required,
      (value) => {
        if (value !== formData.newPassword) {
          return 'Las contraseñas no coinciden';
        }
        return true;
      }
    ]
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    validateField(name, value);
    
    if (error) {
      setError('');
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate(formData)) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      if (result.success) {
        setSuccess(true);
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 2000);
        }
      } else {
        setError(result.message || 'Error al cambiar la contraseña');
      }
    } catch (error) {
      setError('Error al cambiar la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-4">
        <Alert variant="success">
          <div>
            <h3 className="font-medium">¡Contraseña cambiada exitosamente!</h3>
            <p className="mt-1">
              Tu contraseña ha sido actualizada correctamente.
            </p>
          </div>
        </Alert>
        
        {onCancel && (
          <div className="flex justify-end">
            <Button onClick={onCancel}>
              Cerrar
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      <div className="relative">
        <Input
          label="Contraseña Actual"
          type={showPasswords.current ? 'text' : 'password'}
          name="currentPassword"
          value={formData.currentPassword}
          onChange={handleChange}
          placeholder="Ingresa tu contraseña actual"
          icon={<Lock />}
          error={getFieldError('currentPassword')}
          required
        />
        <button
          type="button"
          className="absolute right-3 top-9 text-secondary-400 hover:text-secondary-600"
          onClick={() => togglePasswordVisibility('current')}
        >
          {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>

      <div className="relative">
        <Input
          label="Nueva Contraseña"
          type={showPasswords.new ? 'text' : 'password'}
          name="newPassword"
          value={formData.newPassword}
          onChange={handleChange}
          placeholder="Mínimo 8 caracteres, mayúscula, minúscula y número"
          icon={<Lock />}
          error={getFieldError('newPassword')}
          helperText="La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número"
          required
        />
        <button
          type="button"
          className="absolute right-3 top-9 text-secondary-400 hover:text-secondary-600"
          onClick={() => togglePasswordVisibility('new')}
        >
          {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>

      <div className="relative">
        <Input
          label="Confirmar Nueva Contraseña"
          type={showPasswords.confirm ? 'text' : 'password'}
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Repite tu nueva contraseña"
          icon={<Lock />}
          error={getFieldError('confirmPassword')}
          required
        />
        <button
          type="button"
          className="absolute right-3 top-9 text-secondary-400 hover:text-secondary-600"
          onClick={() => togglePasswordVisibility('confirm')}
        >
          {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
        )}
        
        <Button
          type="submit"
          loading={isLoading}
          disabled={isLoading}
        >
          {isLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
        </Button>
      </div>
    </form>
  );
};

export default ChangePasswordForm;
