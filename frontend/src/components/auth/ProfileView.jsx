import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Edit, Save, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import Alert from '../ui/Alert';
import Modal from '../ui/Modal';
import ChangePasswordForm from './ChangePasswordForm';
import { helpers } from '../../utils/helpers';
import { useFormValidation, commonRules } from '../../utils/validation';

const ProfileView = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    direccion: ''
  });

  const { validateField, validate, getFieldError } = useFormValidation({
    nombre: [commonRules.required, commonRules.name],
    apellido: [commonRules.required, commonRules.name],
    telefono: [commonRules.phone]
  });

  // Inicializar datos del formulario cuando se carga el usuario
  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        telefono: user.telefono || '',
        direccion: user.direccion || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    validateField(name, value);
    
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    setSuccess('');
    
    // Restaurar datos originales
    if (user) {
      setFormData({
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        telefono: user.telefono || '',
        direccion: user.direccion || ''
      });
    }
  };

  const handleSave = async () => {
    if (!validate(formData)) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await updateProfile(formData);
      
      if (result.success) {
        setSuccess('Perfil actualizado correctamente');
        setIsEditing(false);
      } else {
        setError(result.message || 'Error al actualizar el perfil');
      }
    } catch (error) {
      setError('Error al actualizar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChangeSuccess = () => {
    setShowChangePassword(false);
    setSuccess('Contraseña cambiada correctamente');
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const getRoleDisplayName = (roles) => {
    if (!roles || roles.length === 0) return 'Sin rol asignado';
    
    const roleNames = {
      administrador: 'Administrador',
      docente: 'Docente',
      estudiante: 'Estudiante'
    };
    
    return roles.map(role => roleNames[role.nombre] || role.nombre).join(', ');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Mensajes de estado */}
      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" dismissible onDismiss={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Información del perfil */}
      <Card>
        <Card.Header>
          <div className="flex justify-between items-center">
            <div>
              <Card.Title>Mi Perfil</Card.Title>
              <Card.Description>
                Información personal y de contacto
              </Card.Description>
            </div>
            
            <div className="flex space-x-2">
              {!isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Edit />}
                    onClick={handleEdit}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowChangePassword(true)}
                  >
                    Cambiar Contraseña
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<X />}
                    onClick={handleCancel}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    icon={<Save />}
                    onClick={handleSave}
                    loading={isLoading}
                    disabled={isLoading}
                  >
                    Guardar
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card.Header>

        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Avatar y información básica */}
            <div className="flex flex-col items-center space-y-4 md:col-span-2">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold ${helpers.getAvatarColor(user.nombre + ' ' + user.apellido)}`}>
                {helpers.getInitials(user.nombre + ' ' + user.apellido)}
              </div>
              
              <div className="text-center">
                <h2 className="text-xl font-semibold text-secondary-900">
                  {user.nombre} {user.apellido}
                </h2>
                <p className="text-secondary-600">
                  {getRoleDisplayName(user.roles)}
                </p>
              </div>
            </div>

            {/* Información de contacto */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-secondary-900">Información Personal</h3>
              
              {isEditing ? (
                <>
                  <Input
                    label="Nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    icon={<User />}
                    error={getFieldError('nombre')}
                    required
                  />
                  
                  <Input
                    label="Apellido"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleChange}
                    icon={<User />}
                    error={getFieldError('apellido')}
                    required
                  />
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-secondary-400" />
                    <div>
                      <p className="text-sm text-secondary-600">Nombre completo</p>
                      <p className="font-medium">{user.nombre} {user.apellido}</p>
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-secondary-400" />
                <div>
                  <p className="text-sm text-secondary-600">Correo electrónico</p>
                  <p className="font-medium">{user.correo}</p>
                </div>
              </div>

              {user.ci && (
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <span className="text-xs font-bold text-secondary-400">CI</span>
                  </div>
                  <div>
                    <p className="text-sm text-secondary-600">Cédula de Identidad</p>
                    <p className="font-medium">{user.ci}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Información adicional */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-secondary-900">Información de Contacto</h3>
              
              {isEditing ? (
                <>
                  <Input
                    label="Teléfono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    icon={<Phone />}
                    error={getFieldError('telefono')}
                    placeholder="70123456"
                  />
                  
                  <Input
                    label="Dirección"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    icon={<MapPin />}
                    placeholder="Tu dirección completa"
                  />
                </>
              ) : (
                <>
                  {user.telefono && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-secondary-400" />
                      <div>
                        <p className="text-sm text-secondary-600">Teléfono</p>
                        <p className="font-medium">{user.telefono}</p>
                      </div>
                    </div>
                  )}

                  {user.direccion && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-secondary-400" />
                      <div>
                        <p className="text-sm text-secondary-600">Dirección</p>
                        <p className="font-medium">{user.direccion}</p>
                      </div>
                    </div>
                  )}

                  {user.fecha_nacimiento && (
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-secondary-400" />
                      <div>
                        <p className="text-sm text-secondary-600">Fecha de nacimiento</p>
                        <p className="font-medium">
                          {helpers.formatDate(user.fecha_nacimiento, 'long')}
                          {' '}({helpers.calculateAge(user.fecha_nacimiento)} años)
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Modal para cambiar contraseña */}
      <Modal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        title="Cambiar Contraseña"
        size="md"
      >
        <ChangePasswordForm
          onSuccess={handlePasswordChangeSuccess}
          onCancel={() => setShowChangePassword(false)}
        />
      </Modal>
    </div>
  );
};

export default ProfileView;
