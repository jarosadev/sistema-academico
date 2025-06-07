import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Edit, Save, X, GraduationCap, BookOpen, Lock, Shield, Clock, LogOut, Award, Briefcase, Users, School } from 'lucide-react';
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
  const isAdmin = user?.roles?.some(role => role.nombre === 'administrador');
  const isDocente = user?.roles?.some(role => role.nombre === 'docente');
  const isEstudiante = user?.roles?.some(role => role.nombre === 'estudiante');
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
    if (user) {
      setFormData({
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        telefono: user.telefono || '',
        direccion: isEstudiante ? (user.direccion || '') : ''
      });
    }
  };

  const handleSave = async () => {
    if (!validate(formData)) return;
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

  const renderUserAvatar = () => {
    const isAdmin = user?.roles?.some(role => role.nombre === 'administrador');
    return (
      <div className="flex flex-col items-center space-y-4">
        <div
          className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold 
          ${isAdmin ? 'bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-200' : helpers.getAvatarColor(user.nombre + ' ' + user.apellido)}`}
        >
          {isAdmin ? 'A' : helpers.getInitials(user.nombre + ' ' + user.apellido)}
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-secondary-900">
            {isAdmin ? 'Admin' : `${user.nombre} ${user.apellido}`}
          </h2>
          <p className="text-secondary-600 font-medium">
            {getRoleDisplayName(user.roles)}
          </p>
        </div>
      </div>
    );
  };

  const renderPersonalInfo = () => (
    <div className="space-y-4">
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
        <div className="p-4 bg-secondary-50 rounded-lg border border-secondary-100">
          <div className="flex items-center space-x-3">
            <User className="w-5 h-5 text-secondary-400" />
            <div>
              <p className="text-sm text-secondary-600">Nombre completo</p>
              <p className="font-medium">{isAdmin ? 'Admin' : `${user.nombre} ${user.apellido}`}</p>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 bg-secondary-50 rounded-lg border border-secondary-100">
        <div className="flex items-center space-x-3">
          <Mail className="w-5 h-5 text-secondary-400" />
          <div>
            <p className="text-sm text-secondary-600">Correo electrónico</p>
            <p className="font-medium">{user.correo}</p>
          </div>
        </div>
      </div>

      {user.ci && (
        <div className="p-4 bg-secondary-50 rounded-lg border border-secondary-100">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 flex items-center justify-center">
              <span className="text-xs font-bold text-secondary-400">CI</span>
            </div>
            <div>
              <p className="text-sm text-secondary-600">Cédula de Identidad</p>
              <p className="font-medium">{user.ci}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderContactInfo = () => (
    <div className="space-y-4">
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
          
          {isEstudiante && (
            <Input
              label="Dirección"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              icon={<MapPin />}
              placeholder="Tu dirección completa"
            />
          )}
        </>
      ) : (
        <>
          {user.telefono && (
            <div className="p-4 bg-secondary-50 rounded-lg border border-secondary-100">
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-secondary-400" />
                <div>
                  <p className="text-sm text-secondary-600">Teléfono</p>
                  <p className="font-medium">{user.telefono}</p>
                </div>
              </div>
            </div>
          )}

          {isEstudiante && user.direccion && (
            <div className="p-4 bg-secondary-50 rounded-lg border border-secondary-100">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-secondary-400" />
                <div>
                  <p className="text-sm text-secondary-600">Dirección</p>
                  <p className="font-medium">{user.direccion}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderAdminView = () => (
    <div className="grid grid-cols-1 gap-6">
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className=" p-6 ">
          <div className="flex justify-between items-center">
            <div className="">
              <h1 className="text-lg font-bold">Información Administrador</h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowChangePassword(true)}
              className="bg-white hover:bg-indigo-50 text-indigo-600"
            >
              <Lock className="w-4 h-4 mr-2" />
              Cambiar Contraseña
            </Button>
          </div>
        </div>
        
        <Card.Content className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-full">
            {/* Avatar Section */}
            <div className="md:col-span-1 h-full">
              <div className="bg-white p-6 rounded-xl shadow-md border border-indigo-100 hover:shadow-lg transition-shadow duration-300 h-full flex flex-col justify-center">
                {renderUserAvatar()}
              </div>
            </div>

            {/* Information Sections */}
            <div className="md:col-span-2 h-full">
              {/* Personal Information */}
              <div className="bg-white p-4 rounded-xl shadow-md border border-blue-100 hover:shadow-lg transition-shadow duration-300 h-full">
                <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-indigo-500" />
                  Información Personal
                </h3>
                {renderPersonalInfo()}
              </div>

             
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );

  const renderDocenteView = () => (
    <Card>
      <Card.Header>
        <div className="flex justify-between items-center">
          <div>
            <Card.Title>Información del Docente</Card.Title>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="md:col-span-2">
            {renderUserAvatar()}
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-secondary-100">
              <h3 className="text-lg font-medium text-secondary-900 mb-4">Información Personal</h3>
              {renderPersonalInfo()}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-secondary-100">
              <h3 className="text-lg font-medium text-secondary-900 mb-4">Información de Contacto</h3>
              {renderContactInfo()}
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="bg-white p-6 rounded-lg border border-secondary-100">
              <h3 className="text-lg font-medium text-secondary-900 mb-4">Información Académica</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-secondary-50 rounded-lg border border-secondary-100">
                  <div className="flex items-center space-x-3">
                    <Award className="w-5 h-5 text-secondary-400" />
                    <div>
                      <p className="text-sm text-secondary-600">Especialidad</p>
                      <p className="font-medium">{user.especialidad || 'No especificada'}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-secondary-50 rounded-lg border border-secondary-100">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-secondary-400" />
                    <div>
                      <p className="text-sm text-secondary-600">Fecha de Contratación</p>
                      <p className="font-medium">
                        {user.fecha_contratacion
                          ? helpers.formatDate(user.fecha_contratacion, 'long')
                          : 'No registrada'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-secondary-50 rounded-lg border border-secondary-100">
                  <div className="flex items-center space-x-3">
                    <BookOpen className="w-5 h-5 text-secondary-400" />
                    <div>
                      <p className="text-sm text-secondary-600">Materias Asignadas</p>
                      <p className="font-medium">{user.materias_asignadas || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card.Content>
    </Card>
  );

  const renderEstudianteView = () => (
    <Card>
      <Card.Header>
        <div className="flex justify-between items-center">
          <div>
            <Card.Title>Información del Estudiante</Card.Title>
            <Card.Description>Gestiona tu información académica y personal</Card.Description>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="md:col-span-2">
            {renderUserAvatar()}
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-secondary-100">
              <h3 className="text-lg font-medium text-secondary-900 mb-4">Información Personal</h3>
              {renderPersonalInfo()}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-secondary-100">
              <h3 className="text-lg font-medium text-secondary-900 mb-4">Información de Contacto</h3>
              {renderContactInfo()}
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="bg-white p-6 rounded-lg border border-secondary-100">
              <h3 className="text-lg font-medium text-secondary-900 mb-4">Información Académica</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-secondary-50 rounded-lg border border-secondary-100">
                  <div className="flex items-center space-x-3">
                    <GraduationCap className="w-5 h-5 text-secondary-400" />
                    <div>
                      <p className="text-sm text-secondary-600">Mención</p>
                      <p className="font-medium">{user.mencion_nombre || 'No asignada'}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-secondary-50 rounded-lg border border-secondary-100">
                  <div className="flex items-center space-x-3">
                    <BookOpen className="w-5 h-5 text-secondary-400" />
                    <div>
                      <p className="text-sm text-secondary-600">Estado Académico</p>
                      <p className="font-medium">{user.estado_academico || 'No definido'}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-secondary-50 rounded-lg border border-secondary-100">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-secondary-400" />
                    <div>
                      <p className="text-sm text-secondary-600">Fecha de Ingreso</p>
                      <p className="font-medium">
                        {user.fecha_ingreso
                          ? helpers.formatDate(user.fecha_ingreso, 'long')
                          : 'No registrada'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card.Content>
    </Card>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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

      {isAdmin ? renderAdminView() : isDocente ? renderDocenteView() : renderEstudianteView()}

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
