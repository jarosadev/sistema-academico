import React, { useState, useEffect } from 'react';
import { BookOpen, User, Award, Users } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Loading from '../ui/Loading';
import { dataService } from '../../services/dataService';

const MateriaDetalle = ({ materia, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [detalles, setDetalles] = useState(null);

  useEffect(() => {
    cargarDetalles();
  }, [materia.id_materia]);

  const cargarDetalles = async () => {
    try {
      setLoading(true);
      const [detallesResponse, docentesResponse, inscripcionesResponse] = await Promise.all([
        dataService.materias.obtenerPorId(materia.id_materia),
        dataService.materias.obtenerDocentes(materia.id_materia),
        dataService.materias.obtenerInscripciones(materia.id_materia)
      ]);

      // Procesar estadísticas de inscripciones
      const inscripciones = inscripcionesResponse.data;
      const totalEstudiantes = inscripciones.length;
      const aprobados = inscripciones.filter(i => i.estado === 'aprobado').length;
      const tasaAprobacion = totalEstudiantes > 0 ? Math.round((aprobados / totalEstudiantes) * 100) : 0;
      
      // Combinar los datos
      const detallesCompletos = {
        ...detallesResponse.data,
        docentes_asignados: docentesResponse.data,
        estadisticas: {
          total_estudiantes: totalEstudiantes,
          tasa_aprobacion: tasaAprobacion
        }
      };
      
      setDetalles(detallesCompletos);
    } catch (error) {
      console.error('Error al cargar detalles:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (activo) => {
    return activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  if (loading || !detalles) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto px-3 sm:px-0">
      {/* Header con información básica */}
      <Card className="bg-white rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-100 rounded-xl flex-shrink-0 flex items-center justify-center mx-auto sm:mx-0">
            <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <h2 className="text-xl sm:text-2xl font-bold text-secondary-900 break-words">
                {detalles.nombre}
              </h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium self-center sm:self-auto ${getEstadoColor(detalles.activo)}`}>
                {detalles.activo ? 'Activa' : 'Inactiva'}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-sm text-secondary-600">Sigla</p>
                <p className="font-medium">{detalles.sigla}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-600">Semestre</p>
                <p className="font-medium">{detalles.semestre}° Semestre</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm text-secondary-600">Mención</p>
                <p className="font-medium">{detalles.mencion_nombre}</p>
              </div>
            </div>
            {detalles.descripcion && (
              <div className="mt-4">
                <p className="text-sm text-secondary-600">Descripción</p>
                <p className="mt-1 text-secondary-800 text-sm sm:text-base">{detalles.descripcion}</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Estadísticas en cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-semibold text-secondary-900">
                {detalles.docentes_asignados?.length || 0}
              </p>
              <p className="text-xs sm:text-sm text-secondary-600">Docentes Asignados</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
              <Award className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-semibold text-secondary-900">
                {detalles.estadisticas.tasa_aprobacion}%
              </p>
              <p className="text-xs sm:text-sm text-secondary-600">Tasa de Aprobación</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 hover:shadow-md transition-shadow duration-200 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-semibold text-secondary-900">
                {detalles.estadisticas.total_estudiantes}
              </p>
              <p className="text-xs sm:text-sm text-secondary-600">Total Estudiantes</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Lista de docentes */}
      <Card className="overflow-hidden">
        <div className="px-3 sm:px-4 py-3 border-b border-secondary-200">
          <h3 className="text-base sm:text-lg font-semibold text-secondary-900">Docentes Asignados</h3>
        </div>
        <div className="divide-y divide-secondary-200">
          {detalles.docentes_asignados?.length > 0 ? (
            detalles.docentes_asignados.map((docente, index) => (
              <div key={index} className="p-3 sm:p-4 hover:bg-secondary-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div className="min-w-0">
                    <h4 className="text-sm sm:text-base font-medium text-secondary-900 break-words">
                      {docente.nombre} {docente.apellido}
                    </h4>
                    <p className="text-xs sm:text-sm text-secondary-600 mt-1">
                      {docente.especialidad}
                    </p>
                  </div>
                  <div className="text-left sm:text-right flex-shrink-0">
                    <p className="text-xs sm:text-sm font-medium text-secondary-900">
                      Gestión {docente.gestion}
                    </p>
                    <p className="text-xs sm:text-sm text-secondary-600 mt-1">
                      Paralelo {docente.paralelo}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-secondary-600">
              <p className="text-sm sm:text-base">No hay docentes asignados</p>
            </div>
          )}
        </div>
      </Card>

      {/* Botón cerrar */}
      <div className="flex justify-center sm:justify-end pt-4 sm:pt-6 pb-4 sm:pb-0">
        <Button onClick={onClose} className="w-full sm:w-auto">
          Cerrar
        </Button>
      </div>
    </div>
  );
};

export default MateriaDetalle;