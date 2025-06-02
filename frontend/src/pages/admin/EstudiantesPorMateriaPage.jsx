import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { notificationService } from '../../services/notificationService';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Loading from '../../components/ui/Loading';
import Select from '../../components/ui/Select';

const EstudiantesPorMateriaPage = () => {
    const { id_materia } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [materia, setMateria] = useState(null);
    const [estudiantes, setEstudiantes] = useState([]);
    const [paralelos, setParalelos] = useState([]);
    const [selectedParalelo, setSelectedParalelo] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [materiaRes, inscripcionesRes] = await Promise.all([
                    dataService.materias.obtenerPorId(id_materia),
                    dataService.inscripciones.obtenerPorMateria(id_materia)
                ]);

                setMateria(materiaRes.data);
                
                // Get unique paralelos from inscripciones
                const uniqueParalelos = [...new Set(inscripcionesRes.data.map(i => i.paralelo))];
                setParalelos(uniqueParalelos.sort());
                
                // Set default paralelo if available
                if (uniqueParalelos.length > 0) {
                    setSelectedParalelo(uniqueParalelos[0]);
                }

                setEstudiantes(inscripcionesRes.data);
            } catch (error) {
                notificationService.error('Error al cargar los datos');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id_materia]);

    const filteredEstudiantes = estudiantes.filter(e => 
        !selectedParalelo || e.paralelo === selectedParalelo
    );

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
                            Estudiantes - {materia.nombre}
                        </h1>
                        <p className="text-secondary-600">
                            Lista de estudiantes inscritos en {materia.sigla}
                        </p>
                    </div>
                </div>
            </div>


            {/* Filters */}
            <Card className="p-4">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="w-full sm:w-48">
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                            Paralelo
                        </label>
                        <Select
                            value={selectedParalelo}
                            onChange={e => setSelectedParalelo(e.target.value)}
                        >
                            <option value="">Todos</option>
                            {paralelos.map(paralelo => (
                                <option key={paralelo} value={paralelo}>
                                    Paralelo {paralelo}
                                </option>
                            ))}
                        </Select>
                    </div>
                </div>
            </Card>

            {/* Students List */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-secondary-200">
                        <thead className="bg-secondary-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    Estudiante
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    CI
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    Paralelo
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    Nota Final
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-secondary-200">
                            {filteredEstudiantes.map((estudiante) => (
                                <tr key={estudiante.id_inscripcion}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-secondary-900">
                                            {estudiante.estudiante_apellido}, {estudiante.estudiante_nombre}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-secondary-600">
                                            {estudiante.estudiante_ci}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-secondary-600">
                                            {estudiante.paralelo}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                            ${estudiante.estado === 'aprobado' ? 'bg-green-100 text-green-800' : 
                                              estudiante.estado === 'reprobado' ? 'bg-red-100 text-red-800' : 
                                              'bg-yellow-100 text-yellow-800'}`}>
                                            {estudiante.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-secondary-600">
                                            {estudiante.nota_final || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                                        <Button
                                            variant="secondary"
                                            onClick={() => {/* TODO: Implement edit grades */}}
                                        >
                                            Editar Notas
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default EstudiantesPorMateriaPage;
