import React, { useState, useEffect } from 'react';
import { Book, Users, GraduationCap, Calendar } from 'lucide-react';
import { dataService } from '../../services/dataService';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Loading from '../ui/Loading';

const MateriaDetalle = ({ materia, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [docentes, setDocentes] = useState([]);
  const [inscripciones, setInscripciones] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    total_estudiantes: 0,
    promedio_general: 0,
    tasa_aprobacion: 0
  });

  useEffect(() => {
    cargarDetalles();
  }, [materia.id_materia]);

  const cargarDetalles = async () => {
    try {
      setLoading(true);
      const [docentesRes, inscripcionesRes] = await Promise.all([
        dataService.materias.obtenerDocentes(materia.id_materia),
        dataService.materias.obtenerInscripciones(materia.id_materia)
      ]);

      setDocentes(docentesRes.data);
      setInscripciones(inscripcionesRes.data);

      // Calcular estadísticas básicas
      const total = inscripcionesRes.data.length;
      const aprobados = inscripcionesRes.data.filter(i => i.nota_final >= 51).length;
      const promedioGeneral = inscripcionesRes.data.reduce((acc, curr) => acc + curr.nota_final, 0) / total;

      setEstadisticas({
        total_estudiantes: total,
        promedio_general: promedioGeneral.toFixed(2),
        tasa_aprobacion: ((aprobados / total) * 100).toFixed(2)
      });
    } catch (error) {
      console.error('Error al cargar detalles:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Información básica */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Información General</h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <Book className="w-5 h-5 text-primary-500 mr-2" />
              <div>
                <p className="text-sm font-medium text-secondary-700">Sigla</p>
                <p className="text-secondary-900">{materia.sigla}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-primary-500 mr-2" />
              <div>
                <p className="text-sm font-medium text-secondary-700">Semestre</p>
                <p className="text-secondary-900">{materia.semestre}° Semestre</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Descripción</h3>
          <p className="text-secondary-700">{materia.descripcion}</p>
        </div>
      </div>

      {/* Estadísticas */}
      <div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Estadísticas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-secondary-600">Total Estudiantes</p>
                <p className="text-2xl font-bold text-secondary-900">{estadisticas.total_estudiantes}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <GraduationCap className="w-8 h-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-secondary-600">Promedio General</p>
                <p className="text-2xl font-bold text-secondary-900">{estadisticas.promedio_general}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <Book className="w-8 h-8 text-yellow-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-secondary-600">Tasa de Aprobación</p>
                <p className="text-2xl font-bold text-secondary-900">{estadisticas.tasa_aprobacion}%</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Docentes */}
      <div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Docentes Asignados</h3>
        {docentes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {docentes.map(docente => (
              <Card key={docente.id_docente} className="p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-secondary-900">
                      {docente.nombre} {docente.apellido}
                    </h4>
                    <p className="text-sm text-secondary-500">{docente.especialidad}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-secondary-600">No hay docentes asignados a esta materia.</p>
        )}
      </div>

      {/* Botón de cerrar */}
      <div className="flex justify-end mt-6">
        <Button onClick={onClose} variant="secondary">
          Cerrar
        </Button>
      </div>
    </div>
  );
};

export default MateriaDetalle;
