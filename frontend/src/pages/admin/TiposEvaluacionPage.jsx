import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, GraduationCap, Percent, ArrowLeft } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { notificationService } from '../../services/notificationService';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Loading from '../../components/ui/Loading';
import TiposEvaluacionList from '../../components/admin/TiposEvaluacionList';

const StatCard = ({ title, value, icon: Icon, className = '' }) => (
    <Card className={`p-4 ${className}`}>
        <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary-100 rounded-lg">
                <Icon className="w-6 h-6 text-primary-600" />
            </div>
            <div>
                <h3 className="text-sm font-medium text-secondary-600">{title}</h3>
                <p className="text-2xl font-semibold text-secondary-900">{value}</p>
            </div>
        </div>
    </Card>
);

const TiposEvaluacionPage = () => {
    const { id_materia } = useParams();
    const navigate = useNavigate();
    const [materia, setMateria] = useState(null);
    const [estadisticas, setEstadisticas] = useState(null);
    const [docentes, setDocentes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [materiaRes, docentesRes, inscripcionesRes] = await Promise.all([
                    dataService.materias.obtenerPorId(id_materia),
                    dataService.materias.obtenerDocentes(id_materia),
                    dataService.inscripciones.obtenerPorMateria(id_materia)
                ]);
                console.log(materiaRes, docentesRes, inscripcionesRes);

                setMateria(materiaRes.data);
                setDocentes(docentesRes.data);

                // Calcular estadísticas
                const inscripciones = inscripcionesRes.data;
                const totalEstudiantes = inscripciones.length;
                const aprobados = inscripciones.filter(i => i.estado === 'aprobado').length;
                const promedioGeneral = inscripciones.reduce((sum, i) => sum + (i.promedio || 0), 0) / (totalEstudiantes || 1);
                const tasaAprobacion = totalEstudiantes ? (aprobados / totalEstudiantes) * 100 : 0;

                setEstadisticas({
                    totalEstudiantes,
                    promedioGeneral: promedioGeneral.toFixed(2),
                    tasaAprobacion: tasaAprobacion.toFixed(1)
                });

            } catch (error) {
                notificationService.error('Error al cargar la información de la materia');
            } finally {
                setLoading(false);
            }
        };

        if (id_materia) {
            fetchData();
        }
    }, [id_materia]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loading />
            </div>
        );
    }

    if (!materia) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <p className="text-secondary-600">Materia no encontrada</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <Button
                        variant="secondary"
                        onClick={() => navigate(-1)}
                        className="w-fit flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver
                    </Button>
                    <div className="space-y-1">
                        <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900 break-words">
                            Tipos de Evaluación - {materia.nombre}
                        </h1>
                        <p className="text-secondary-600">
                            Gestión de tipos de evaluación para la materia {materia.sigla}
                        </p>
                    </div>
                </div>
            </div>


            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    title="Total Estudiantes"
                    value={estadisticas?.totalEstudiantes || 0}
                    icon={Users}
                />
                <StatCard
                    title="Promedio General"
                    value={estadisticas?.promedioGeneral || 0}
                    icon={GraduationCap}
                />
                <StatCard
                    title="Tasa de Aprobación"
                    value={`${estadisticas?.tasaAprobacion || 0}%`}
                    icon={Percent}
                />
            </div>

            {/* Docentes Asignados */}
            <Card className="p-4">
                <h2 className="text-lg font-semibold text-secondary-900 mb-4">
                    Docentes Asignados
                </h2>
                {docentes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {docentes.map((docente) => (
                            <div 
                                key={docente.id_docente} 
                                className="p-3 bg-secondary-50 rounded-lg"
                            >
                                <p className="font-medium text-secondary-900">
                                    {docente.nombre} {docente.apellido}
                                </p>
                                <p className="text-sm text-secondary-600">
                                    Paralelo: {docente.paralelo || 'A'}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-secondary-600">No hay docentes asignados</p>
                )}
            </Card>

            {/* Lista de tipos de evaluación */}
            <Card className="p-4">
                <TiposEvaluacionList materiaId={id_materia} />
            </Card>
        </div>
    );
};

export default TiposEvaluacionPage;
