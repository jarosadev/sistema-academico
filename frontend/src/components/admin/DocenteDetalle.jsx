import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Briefcase, Calendar, BookOpen, Users, Award, Clock } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Loading from '../ui/Loading';
import Modal from '../ui/Modal';
import { dataService } from '../../services/dataService';

const DocenteDetalle = ({ docente, onClose, onAsignarMateria }) => {
  const [materias, setMaterias] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [cargaAcademica, setCargaAcademica] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [showAsignarModal, setShowAsignarModal] = useState(false);
  const [materiasDisponibles, setMateriasDisponibles] = useState([]);

  useEffect(() => {
    cargarDatosAdicionales();
  }, [docente.id_docente]);

  const cargarDatosAdicionales = async () => {
    try {
      setLoading(true);
      const [materiasRes, estudiantesRes, cargaRes] = await Promise.all([
        dataService.docentes.getMaterias(docente.id_docente).catch(() => ({ data: [] })),
        dataService.docentes.getEstudiantes(docente.id_docente).catch(() => ({ data: [] })),
        dataService.docentes.getCargaAcademica(docente.id_docente).catch(() => ({ data: [] }))
      ]);
      
      setMaterias(materiasRes.data || []);
      setEstudiantes(estudiantesRes.data || []);
      setCargaAcademica(cargaRes.data || []);
    } catch (error) {
      console.error('Error al cargar datos adicionales:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarMateriasDisponibles = async () => {
    try {
      const response = await dataService.materias.getAll({ limit: 100 });
      // Filtrar materias que no están asignadas al docente
      const materiasAsignadas = materias.map(m => m.id_materia);
      const disponibles = response.data.filter(m => !materiasAsignadas.includes(m.id_materia));
      setMateriasDisponibles(disponibles);
    } catch (error) {
      console.error('Error al cargar materias disponibles:', error);
    }
  };

  const handleAsignarMateria = async (materiaId) => {
    try {
      await onAsignarMateria(docente.id_docente, materiaId);
      setShowAsignarModal(false);
      cargarDatosAdicionales();
    } catch (error) {
      console.error('Error al asignar materia:', error);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No disponible';
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  const getEstadoColor = (activo) => {
    return activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const tabs = [
    { id: 'info', label: 'Información Personal', icon: User },
    { id: 'materias', label: 'Materias Asignadas', icon: BookOpen },
    { id: 'estudiantes', label: 'Estudiantes', icon: Users },
    { id: 'carga', label: 'Carga Académica', icon: Award }
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
              {docente.nombre} {docente.apellido}
            </h2>
            <p className="text-secondary-600">CI: {docente.ci}</p>
            <p className="text-secondary-600">{docente.especialidad}</p>
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(docente.activo)}`}>
              {docente.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
        
        {/* Botones de acción */}
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              cargarMateriasDisponibles();
              setShowAsignarModal(true);
            }}
          >
            Asignar Materia
          </Button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <BookOpen className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Materias</p>
              <p className="text-2xl font-bold text-secondary-900">{materias.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Estudiantes</p>
              <p className="text-2xl font-bold text-secondary-900">{estudiantes.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Años Servicio</p>
              <p className="text-2xl font-bold text-secondary-900">
                {docente.fecha_contratacion ? 
                  Math.floor((new Date() - new Date(docente.fecha_contratacion)) / (365.25 * 24 * 60 * 60 * 1000)) : 0}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <Award className="w-8 h-8 text-orange-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Carga Actual</p>
              <p className="text-2xl font-bold text-secondary-900">{cargaAcademica.length}</p>
            </div>
          </div>
        </Card>
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
                    <p className="font-medium">{docente.nombre} {docente.apellido}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-secondary-400" />
                  <div>
                    <p className="text-sm text-secondary-600">Correo Electrónico</p>
                    <p className="font-medium">{docente.correo}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-secondary-400" />
                  <div>
                    <p className="text-sm text-secondary-600">Teléfono</p>
                    <p className="font-medium">{docente.telefono || 'No disponible'}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-medium text-secondary-900 mb-4">Información Profesional</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Briefcase className="w-5 h-5 text-secondary-400" />
                  <div>
                    <p className="text-sm text-secondary-600">Especialidad</p>
                    <p className="font-medium">{docente.especialidad}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-secondary-400" />
                  <div>
                    <p className="text-sm text-secondary-600">Fecha de Contratación</p>
                    <p className="font-medium">{formatearFecha(docente.fecha_contratacion)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-secondary-400" />
                  <div>
                    <p className="text-sm text-secondary-600">Último Acceso</p>
                    <p className="font-medium">{formatearFecha(docente.ultimo_acceso)}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'materias' && (
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-secondary-900">Materias Asignadas</h3>
              <Button
                size="sm"
                onClick={() => {
                  cargarMateriasDisponibles();
                  setShowAsignarModal(true);
                }}
              >
                Asignar Nueva Materia
              </Button>
            </div>
            {loading ? (
              <Loading />
            ) : materias.length > 0 ? (
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
                        Semestre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Mención
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Gestión
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-secondary-200">
                    {materias.map((materia) => (
                      <tr key={materia.id_materia}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">
                          {materia.materia_nombre}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                          {materia.sigla}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                          {materia.semestre}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                          {materia.mencion_nombre}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                          {materia.gestion}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-secondary-500 text-center py-4">No hay materias asignadas</p>
            )}
          </Card>
        )}

        {activeTab === 'estudiantes' && (
          <Card className="p-6">
            <h3 className="text-lg font-medium text-secondary-900 mb-4">Estudiantes Asignados</h3>
            {loading ? (
              <Loading />
            ) : estudiantes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-secondary-200">
                  <thead className="bg-secondary-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        CI
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Correo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-secondary-200">
                    {estudiantes.map((estudiante) => (
                      <tr key={estudiante.id_estudiante}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">
                          {estudiante.nombre} {estudiante.apellido}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                          {estudiante.ci}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                          {estudiante.correo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            estudiante.estado_academico === 'activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {estudiante.estado_academico}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-secondary-500 text-center py-4">No hay estudiantes asignados</p>
            )}
          </Card>
        )}
      </div>

      {/* Modal para asignar materia */}
      <Modal
        isOpen={showAsignarModal}
        onClose={() => setShowAsignarModal(false)}
        title="Asignar Materia"
      >
        <div className="space-y-4">
          <p className="text-secondary-600">
            Seleccione una materia para asignar al docente {docente.nombre} {docente.apellido}:
          </p>
          
          {materiasDisponibles.length > 0 ? (
            <div className="max-h-60 overflow-y-auto space-y-2">
              {materiasDisponibles.map((materia) => (
                <div
                  key={materia.id_materia}
                  className="p-3 border border-secondary-200 rounded-lg hover:bg-secondary-50 cursor-pointer"
                  onClick={() => handleAsignarMateria(materia.id_materia)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-secondary-900">{materia.nombre}</p>
                      <p className="text-sm text-secondary-600">
                        {materia.sigla} - Semestre {materia.semestre}
                      </p>
                    </div>
                    <Button size="sm">Asignar</Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-secondary-500 text-center py-4">
              No hay materias disponibles para asignar
            </p>
          )}
          
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setShowAsignarModal(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Botón cerrar */}
      <div className="flex justify-end pt-6 border-t">
        <Button onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </div>
  );
};

export default DocenteDetalle;
