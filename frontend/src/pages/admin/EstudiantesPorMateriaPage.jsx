import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertTriangle, CheckCircle } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { notificationService } from '../../services/notificationService';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Loading from '../../components/ui/Loading';
import Select from '../../components/ui/Select';
import Modal, { useModal } from '../../components/ui/Modal';

const EstudiantesPorMateriaPage = () => {
    const { id_materia } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [materia, setMateria] = useState(null);
    const [estudiantes, setEstudiantes] = useState([]);
    const [paralelos, setParalelos] = useState([]);
    const [selectedParalelo, setSelectedParalelo] = useState('');
    const [tiposEvaluacion, setTiposEvaluacion] = useState([]);
    const [notas, setNotas] = useState({});
    
    // Modal states
    const confirmModal = useModal();
    const [modalData, setModalData] = useState({ faltantes: [], totalFaltantes: 0 });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [materiaRes, inscripcionesRes, tiposEvalRes, docentesRes] = await Promise.all([
                dataService.materias.obtenerPorId(id_materia),
                dataService.inscripciones.obtenerPorMateria(id_materia),
                dataService.tiposEvaluacion.obtenerTodos(id_materia),
                dataService.materias.obtenerDocentes(id_materia)
            ]);

            // Verificar si hay docentes asignados
            if (!docentesRes.data || docentesRes.data.length === 0) {
                notificationService.error('No hay docentes asignados a esta materia. No se pueden registrar notas.');
                navigate(-1);
                return;
            }

            setMateria(materiaRes.data);
            setTiposEvaluacion(tiposEvalRes.data || []);
            
            // Get unique paralelos from inscripciones
            const uniqueParalelos = [...new Set(inscripcionesRes.data.map(i => i.paralelo))];
            setParalelos(uniqueParalelos.sort());
            
            // Set default paralelo if available
            if (uniqueParalelos.length > 0) {
                setSelectedParalelo(uniqueParalelos[0]);
            }

            setEstudiantes(inscripcionesRes.data);

            // Fetch existing grades
            const notasRes = await dataService.notas.obtenerPorMateria(id_materia);
            const notasMap = {};
            notasRes.data.forEach(nota => {
                if (!notasMap[nota.id_inscripcion]) {
                    notasMap[nota.id_inscripcion] = {};
                }
                notasMap[nota.id_inscripcion][nota.id_tipo_evaluacion] = nota.calificacion;
            });
            setNotas(notasMap);
        } catch (error) {
            notificationService.error('Error al cargar los datos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id_materia, navigate]);

    const calcularNotaFinal = (notasEstudiante) => {
        if (!notasEstudiante || !tiposEvaluacion.length) return { notaFinal: null, porcentajeCompletado: 0 };
        
        let notaFinal = 0;
        let porcentajeTotal = 0;

        tiposEvaluacion.forEach(tipo => {
            const nota = notasEstudiante[tipo.id_tipo_evaluacion];
            if (nota !== undefined && nota !== '') {
                // La nota está sobre 100, multiplicamos por el porcentaje directamente
                notaFinal += parseFloat(nota) * (tipo.porcentaje / 100);
                porcentajeTotal += tipo.porcentaje;
            }
        });

        // Si no hay notas registradas o el porcentaje total es 0, retornamos null
        if (porcentajeTotal === 0) return { notaFinal: null, porcentajeCompletado: 0 };

        // No ajustamos por porcentaje incompleto para mantener el estado actual
        // Esto permite ver el progreso real sin proyecciones

        // Redondeamos a 2 decimales
        return { 
            notaFinal: Math.round(notaFinal * 100) / 100,
            porcentajeCompletado: porcentajeTotal
        };
    };

    const handleNotaChange = (inscripcionId, tipoEvalId, value) => {
        // Validate input
        if (value !== '') {
            if (isNaN(value)) {
                notificationService.error('La nota debe ser un número válido');
                return;
            }
            const numValue = parseFloat(value);
            if (numValue < 0 || numValue > 100) {
                notificationService.error('La nota debe estar entre 0 y 100');
                return;
            }
            // Redondear a 2 decimales
            value = Math.round(numValue * 100) / 100;
        }

        setNotas(prev => {
            const updatedNotas = {
                ...prev,
                [inscripcionId]: {
                    ...(prev[inscripcionId] || {}),
                    [tipoEvalId]: value
                }
            };

            return updatedNotas;
        });
    };

    const validarNotas = () => {
        const faltantes = [];
        
        filteredEstudiantes.forEach(estudiante => {
            const notasEstudiante = notas[estudiante.id_inscripcion] || {};
            tiposEvaluacion.forEach(tipo => {
                const nota = notasEstudiante[tipo.id_tipo_evaluacion];
                if (nota === undefined || nota === '') {
                    faltantes.push({
                        estudiante: `${estudiante.estudiante_apellido}, ${estudiante.estudiante_nombre}`,
                        tipo: tipo.nombre
                    });
                }
            });
        });

        return faltantes;
    };

    const handleSaveNotas = async () => {
        try {
            // Validar que todas las notas estén en el rango correcto
            const notasInvalidas = [];
            Object.entries(notas).forEach(([id_inscripcion, tiposNotas]) => {
                Object.entries(tiposNotas).forEach(([id_tipo_evaluacion, calificacion]) => {
                    if (calificacion !== '' && (isNaN(calificacion) || calificacion < 0 || calificacion > 100)) {
                        const estudiante = estudiantes.find(e => e.id_inscripcion === parseInt(id_inscripcion));
                        notasInvalidas.push(`${estudiante.estudiante_apellido}, ${estudiante.estudiante_nombre}`);
                    }
                });
            });

            if (notasInvalidas.length > 0) {
                notificationService.error(`Hay notas fuera del rango permitido (0-100) para los siguientes estudiantes:\n${notasInvalidas.join('\n')}`);
                return;
            }

            const faltantes = validarNotas();
            
            if (faltantes.length > 0) {
                setModalData({ 
                    faltantes, 
                    totalFaltantes: faltantes.length 
                });
                confirmModal.openModal();
                return;
            }
            
            await guardarNotas();
        } catch (error) {
            notificationService.error('Error al procesar las notas: ' + error.message);
        }
    };

    const guardarNotas = async () => {
        try {

            setSaving(true);
            const notasToSave = [];

            Object.entries(notas).forEach(([id_inscripcion, tiposNotas]) => {
                Object.entries(tiposNotas).forEach(([id_tipo_evaluacion, calificacion]) => {
                    if (calificacion !== undefined && calificacion !== '') {
                        notasToSave.push({
                            id_inscripcion: parseInt(id_inscripcion),
                            id_tipo_evaluacion: parseInt(id_tipo_evaluacion),
                            calificacion: parseFloat(calificacion)
                        });
                    }
                });
            });

            // Determine which paralelos to send
            const paralelosToSend = selectedParalelo ? [selectedParalelo] : paralelos;
            console.log(notasToSave, paralelosToSend)
            const response = await dataService.notas.registroMasivo({ 
                notas: notasToSave,
                paralelos: paralelosToSend
            });
            const { data } = response;
            if (data && data.fallidas > 0) {
                const mensajeError = `Se guardaron ${data.exitosas} notas, pero fallaron ${data.fallidas}.\nErrores:\n${data.errores.join('\n')}`;
                notificationService.error(mensajeError);
            } else {
                notificationService.success('Notas guardadas exitosamente');
            }
            
            // Recargar los datos para actualizar los estados de inscripción
            await fetchData();
        } catch (error) {
            notificationService.error('Error al guardar las notas: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

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
                <Button
                    variant="primary"
                    onClick={handleSaveNotas}
                    disabled={saving}
                    className="flex items-center gap-2"
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Guardando...' : 'Guardar Notas'}
                </Button>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex flex-col sm:flex-row gap-6 items-end">
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
                    <div className="flex-1">
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-blue-700">
                                        Las notas de cada tipo de evaluación son sobre 100 puntos. La nota final se calcula ponderando según el porcentaje asignado a cada evaluación. 
                                        Un estudiante aprueba la materia si su nota final ponderada es mayor o igual a 51 puntos.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Students List */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-secondary-200">
                        <thead className="bg-secondary-50">
                            <tr>
                                <th scope="col" className="sticky left-0 z-10 bg-secondary-50 px-3 sm:px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider min-w-[120px] sm:min-w-[200px]">
                                    Estudiante
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider min-w-[100px]">
                                    CI
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider min-w-[80px]">
                                    Paralelo
                                </th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                    Notas por Tipo de Evaluación
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider min-w-[100px]">
                                    Estado
                                </th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-secondary-500 uppercase tracking-wider min-w-[100px]">
                                    Nota Final
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-secondary-200">
                            {filteredEstudiantes.map((estudiante) => {
                                const notasEstudiante = notas[estudiante.id_inscripcion] || {};
                                const { notaFinal, porcentajeCompletado } = calcularNotaFinal(notasEstudiante);
                                
                                // Determine status based on final grade
                                let estado = 'pendiente';
                                if (notaFinal !== null) {
                                    estado = notaFinal >= 51 ? 'aprobado' : 'reprobado';
                                }

                                return (
                                    <tr key={estudiante.id_inscripcion} className="hover:bg-secondary-50 transition-colors">
                                        <td className="sticky left-0 z-10 bg-white px-3 sm:px-6 py-4 whitespace-nowrap border-r border-secondary-200">
                                            <div className="text-sm font-medium text-secondary-900">
                                                <span className="block sm:hidden">
                                                    {estudiante.estudiante_apellido.split(' ')[0]}, {estudiante.estudiante_nombre.split(' ')[0]}
                                                </span>
                                                <span className="hidden sm:block">
                                                    {estudiante.estudiante_apellido}, {estudiante.estudiante_nombre}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-secondary-600">
                                                {estudiante.estudiante_ci}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-secondary-600 text-center">
                                                {estudiante.paralelo}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="overflow-x-auto">
                                                <div className="flex items-center gap-4 min-w-max px-2 py-1">
                                                    {tiposEvaluacion.map(tipo => (
                                                        <div key={tipo.id_tipo_evaluacion} className="flex flex-col items-center flex-shrink-0 max-w-[100px]">
                                                            <label 
                                                                className="text-xs font-medium text-secondary-500 mb-1 text-center w-full"
                                                                title={`${tipo.nombre} (${tipo.porcentaje}%)`}
                                                            >
                                                                <span className="block truncate">{tipo.nombre}</span>
                                                                <span className="text-secondary-400">({tipo.porcentaje}%)</span>
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                step="0.01"
                                                                className={`w-20 px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-center transition-all
                                                                    ${notas[estudiante.id_inscripcion]?.[tipo.id_tipo_evaluacion] === undefined 
                                                                        ? 'border-dashed border-secondary-300 text-secondary-400 hover:border-secondary-400' 
                                                                        : 'border-secondary-300 hover:border-secondary-400'}`}
                                                                value={notas[estudiante.id_inscripcion]?.[tipo.id_tipo_evaluacion] ?? ''}
                                                                placeholder="S/N"
                                                                onChange={(e) => handleNotaChange(estudiante.id_inscripcion, tipo.id_tipo_evaluacion, e.target.value)}
                                                                onBlur={(e) => {
                                                                    if (e.target.value !== '' && !isNaN(e.target.value)) {
                                                                        const rounded = Math.round(parseFloat(e.target.value) * 100) / 100;
                                                                        handleNotaChange(estudiante.id_inscripcion, tipo.id_tipo_evaluacion, rounded.toString());
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                ${estado === 'aprobado' ? 'bg-green-100 text-green-800' : 
                                                  estado === 'reprobado' ? 'bg-red-100 text-red-800' : 
                                                  'bg-yellow-100 text-yellow-800'}`}>
                                                {estado}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm">
                                                {notaFinal !== null ? (
                                                    <span className={`text-lg font-semibold ${
                                                        notaFinal >= 51 ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                        {notaFinal}
                                                    </span>
                                                ) : (
                                                    <span className="text-secondary-400">-</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Modal de confirmación para notas faltantes */}
            <Modal
                isOpen={confirmModal.isOpen}
                onClose={confirmModal.closeModal}
                title="Notas Incompletas"
                size="lg"
                footer={
                    <>
                        <Button
                            variant="secondary"
                            onClick={confirmModal.closeModal}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={async () => {
                                confirmModal.closeModal();
                                await guardarNotas();
                            }}
                            className="flex items-center gap-2"
                        >
                            <CheckCircle className="w-4 h-4" />
                            Guardar de todas formas
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                            <p className="text-lg font-medium text-secondary-900">
                                Se detectaron {modalData.totalFaltantes} notas faltantes
                            </p>
                            <p className="text-sm text-secondary-600 mt-1">
                                Algunos estudiantes no tienen todas sus evaluaciones registradas.
                            </p>
                        </div>
                    </div>

                    {modalData.totalFaltantes <= 10 ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h4 className="font-medium text-yellow-900 mb-2">Detalle de notas faltantes:</h4>
                            <ul className="space-y-1 text-sm text-yellow-800">
                                {modalData.faltantes.map((f, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <span className="text-yellow-600">•</span>
                                        <span>
                                            <strong>{f.estudiante}:</strong> {f.tipo}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <h4 className="font-medium text-yellow-900 mb-3">Resumen por tipo de evaluación:</h4>
                                <div className="space-y-2">
                                    {tiposEvaluacion.map(tipo => {
                                        const count = modalData.faltantes.filter(f => f.tipo === tipo.nombre).length;
                                        if (count === 0) return null;
                                        return (
                                            <div key={tipo.id_tipo_evaluacion} className="flex justify-between items-center text-sm">
                                                <span className="text-yellow-800">{tipo.nombre}:</span>
                                                <span className="font-medium text-yellow-900">{count} estudiantes</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800">
                                    <strong>Nota:</strong> Las notas faltantes se pueden completar más tarde. 
                                    Los estudiantes aparecerán con estado "pendiente" hasta que se registren todas sus evaluaciones.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="bg-secondary-50 rounded-lg p-4">
                        <p className="text-sm text-secondary-700">
                            ¿Desea continuar y guardar solo las notas que han sido ingresadas?
                        </p>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default EstudiantesPorMateriaPage;
