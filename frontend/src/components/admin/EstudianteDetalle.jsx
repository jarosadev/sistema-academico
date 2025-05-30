import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, GraduationCap, BookOpen, Award, Clock } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Loading from '../ui/Loading';
import { dataService } from '../../services/dataService';

const EstudianteDetalle = ({ estudiante, onClose, onCambiarEstado }) => {
  const [inscripciones, setInscripciones] = useState([]);
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    cargarDatosAdicionales();
  }, [estudiante.id_estudiante]);

  const cargarDatosAdicionales = async () => {
    try {
      setLoading(true);
      const [inscripcionesRes, notasRes] = await Promise.all([
        dataService.estudiantes.getInscripciones(estudiante.id_estudiante),
        dataService.estudiantes.getNotas(estudiante.id_estudiante)
      ]);
      
      setInscripciones(inscripcionesRes.data || []);
      setNotas(notasRes.data || []);
    } catch (error) {
      console.error('Error al cargar datos adicionales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarEstado = (nuevoEstado) => {
    if (window.confirm(`¿Está seguro de cambiar el estado a "${nuevoEstado}"?`)) {
      onCambiarEstado(estudiante, nuevoEstado);
    }
  };

  const calcularPromedio = () => {
    if (notas.length === 0) return 0;
    const suma = notas.reduce((acc, nota) => acc + (nota.nota_final || 0), 0);
    return (suma / notas.length).toFixed(2);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No disponible';
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'activo': return 'bg-green-100 text-green-800';
      case 'graduado': return 'bg-blue-100 text-blue-800';
      case 'suspendido': return 'bg-red-100 text-red-800';
      case 'inactivo': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'info', label: 'Información Personal', icon: User },
    { id: 'academico', label: 'Historial Académico', icon: GraduationCap },
    { id: 'inscripciones', label: 'Inscripciones', icon: BookOpen },
    { id: 'notas', label: 'Notas', icon: Award }
  ];

  return (
    <div className="space-y-6">
      {/* Header con información básica */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-primary-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-secondary-900">
              {estudiante.nombre} {estudiante.apellido}
            </h2>
            <p className="text-secondary-600">CI: {estudiante.ci}</p>
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(estudiante.estado_academico)}`}>
              {estudiante.estado_academico}
            </span>
          </div>
        </div>
        
        {/* Botones de acción */}
        <div className="flex space-x-2">
          {estudiante.estado_academico === 'activo' && (
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleCambiarEstado('suspendido')}
              >
                Suspender
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleCambiarEstado('graduado')}
              >
                Graduar
              </Button>
            </>
          )}
          {estudiante.estado_academico === 'suspendido' && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleCambiarEstado('activo')}
            >
              Reactivar
            </Button>
          )}
          {estudiante.estado_academico === 'inactivo' && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleCambiarEstado('activo')}
            >
              Activar
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-secondary-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenido de tabs */}
      <div className="mt-6">
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-medium text-secondary-900 mb-4">Información Personal</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-secondary-400" />
                  <div>
                    <p className="text-sm text-secondary-600">Nombre Completo</p>
                    <p className="font-medium">{estudiante.nombre} {estudiante.apellido}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-secondary-400" />
                  <div>
                    <p className="text-sm text-secondary-600">Fecha de Nacimiento</p>
                    <p className="font-medium">{formatearFecha(estudiante.fecha_nacimiento)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-secondary-400" />
                  <div>
                    <p className="text-sm text-secondary-600">Dirección</p>
                    <p className="font-medium">{estudiante.direccion || 'No disponible'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-secondary-400" />
                  <div>
                    <p className="text-sm text-secondary-600">Teléfono</p>
                    <p className="font-medium">{estudiante.telefono || 'No disponible'}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-medium text-secondary-900 mb-4">Información Académica</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-secondary-400" />
                  <div>
                    <p className="text-sm text-secondary-600">Correo Electrónico</p>
                    <p className="font-medium">{estudiante.correo}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <GraduationCap className="w-5 h-5 text-secondary-400" />
                  <div>
                    <p className="text-sm text-secondary-600">Mención</p>
                    <p className="font-medium">{estudiante.mencion_nombre || 'No asignada'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-secondary-400" />
                  <div>
                    <p className="text-sm text-secondary-600">Fecha de Ingreso</p>
                    <p className="font-medium">{formatearFecha(estudiante.fecha_ingreso)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Award className="w-5 h-5 text-secondary-400" />
                  <div>
                    <p className="text-sm text-secondary-600">Promedio General</p>
                    <p className="font-medium">{calcularPromedio()}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'inscripciones' && (
          <Card className="p-6">
            <h3 className="text-lg font-medium text-secondary-900 mb-4">Inscripciones</h3>
            {loading ? (
              <Loading />
            ) : inscripciones.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-secondary-200">
                  <thead className="bg-secondary-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Materia
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Sigla
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Gestión
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-secondary-200">
                    {inscripciones.map((inscripcion) => (
                      <tr key={inscripcion.id_inscripcion}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">
                          {inscripcion.materia_nombre}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                          {inscripcion.materia_sigla}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                          {inscripcion.gestion}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            inscripcion.estado === 'activa' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {inscripcion.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-secondary-500 text-center py-4">No hay inscripciones registradas</p>
            )}
          </Card>
        )}

        {activeTab === 'notas' && (
          <Card className="p-6">
            <h3 className="text-lg font-medium text-secondary-900 mb-4">Historial de Notas</h3>
            {loading ? (
              <Loading />
            ) : notas.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-secondary-200">
                  <thead className="bg-secondary-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Materia
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Gestión
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Nota Final
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-secondary-200">
                    {notas.map((nota) => (
                      <tr key={nota.id_nota}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">
                          {nota.materia_nombre}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                          {nota.gestion}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                          <span className={`font-medium ${
                            nota.nota_final >= 51 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {nota.nota_final || 'Pendiente'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            nota.nota_final >= 51 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {nota.nota_final >= 51 ? 'Aprobado' : 'Reprobado'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-secondary-500 text-center py-4">No hay notas registradas</p>
            )}
          </Card>
        )}
      </div>

      {/* Botón cerrar */}
      <div className="flex justify-end pt-6 border-t">
        <Button onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </div>
  );
};

export default EstudianteDetalle;
