const { executeQuery } = require('../config/database');
const { createError } = require('../middleware/errorHandler');
const { auditAction } = require('../middleware/audit-complete');

/**
 * Controlador para generación de reportes académicos
 */
class ReporteController {
    
    /**
     * Reporte general del sistema
     */
    async reporteGeneral(req, res, next) {
        try {
            const { gestion = new Date().getFullYear() } = req.query;

            // Estadísticas generales
            const estadisticasQuery = `
                SELECT 
                    (SELECT COUNT(*) FROM estudiantes WHERE estado_academico = 'activo') as estudiantes_activos,
                    (SELECT COUNT(*) FROM docentes WHERE activo = TRUE) as docentes_activos,
                    (SELECT COUNT(*) FROM materias WHERE activo = TRUE) as materias_activas,
                    (SELECT COUNT(*) FROM menciones WHERE activo = TRUE) as menciones_activas,
                    (SELECT COUNT(*) FROM inscripciones WHERE gestion = ?) as inscripciones_gestion,
                    (SELECT COUNT(*) FROM notas n INNER JOIN inscripciones i ON n.id_inscripcion = i.id_inscripcion WHERE i.gestion = ?) as notas_registradas
            `;

            // Rendimiento académico por mención
            const rendimientoPorMencionQuery = `
                SELECT 
                    men.nombre as mencion,
                    COUNT(DISTINCT e.id_estudiante) as total_estudiantes,
                    COUNT(DISTINCT CASE WHEN i.estado = 'aprobado' THEN i.id_inscripcion END) as materias_aprobadas,
                    COUNT(DISTINCT CASE WHEN i.estado = 'reprobado' THEN i.id_inscripcion END) as materias_reprobadas,
                    AVG(CASE WHEN n.tipo_evaluacion = 'final' THEN n.calificacion END) as promedio_general
                FROM menciones men
                LEFT JOIN estudiantes e ON men.id_mencion = e.id_mencion
                LEFT JOIN inscripciones i ON e.id_estudiante = i.id_estudiante AND i.gestion = ?
                LEFT JOIN notas n ON i.id_inscripcion = n.id_inscripcion
                WHERE men.activo = TRUE
                GROUP BY men.id_mencion, men.nombre
                ORDER BY promedio_general DESC
            `;

            // Top materias con más inscripciones
            const topMateriasQuery = `
                SELECT 
                    m.nombre as materia,
                    m.sigla,
                    men.nombre as mencion,
                    COUNT(i.id_inscripcion) as total_inscripciones,
                    COUNT(CASE WHEN i.estado = 'aprobado' THEN 1 END) as aprobados,
                    ROUND(COUNT(CASE WHEN i.estado = 'aprobado' THEN 1 END) * 100.0 / COUNT(i.id_inscripcion), 2) as porcentaje_aprobacion
                FROM materias m
                LEFT JOIN menciones men ON m.id_mencion = men.id_mencion
                LEFT JOIN inscripciones i ON m.id_materia = i.id_materia AND i.gestion = ?
                WHERE m.activo = TRUE
                GROUP BY m.id_materia
                HAVING total_inscripciones > 0
                ORDER BY total_inscripciones DESC
                LIMIT 10
            `;

            const [estadisticas, rendimientoPorMencion, topMaterias] = await Promise.all([
                executeQuery(estadisticasQuery, [gestion, gestion]),
                executeQuery(rendimientoPorMencionQuery, [gestion]),
                executeQuery(topMateriasQuery, [gestion])
            ]);

            // Auditar consulta de reporte
            await auditAction(req, 'reportes', 'SELECT', null, null, {
                tipo: 'reporte_general',
                gestion: parseInt(gestion)
            });

            res.json({
                success: true,
                data: {
                    gestion: parseInt(gestion),
                    fecha_generacion: new Date().toISOString(),
                    estadisticas_generales: estadisticas[0],
                    rendimiento_por_mencion: rendimientoPorMencion.map(item => ({
                        ...item,
                        promedio_general: item.promedio_general ? Math.round(item.promedio_general * 100) / 100 : null
                    })),
                    top_materias: topMaterias
                }
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Reporte de rendimiento académico por estudiante
     */
    async reporteRendimientoEstudiante(req, res, next) {
        try {
            const { id_estudiante } = req.params;
            const { incluir_historial = 'true' } = req.query;

            // Información básica del estudiante
            const estudianteQuery = `
                SELECT 
                    e.*,
                    men.nombre as mencion_nombre,
                    u.correo
                FROM estudiantes e
                LEFT JOIN menciones men ON e.id_mencion = men.id_mencion
                LEFT JOIN usuarios u ON e.id_usuario = u.id_usuario
                WHERE e.id_estudiante = ?
            `;

            const estudiante = await executeQuery(estudianteQuery, [id_estudiante]);

            if (estudiante.length === 0) {
                throw createError(404, 'Estudiante no encontrado');
            }

            // Resumen académico actual
            const resumenQuery = `
                SELECT 
                    COUNT(DISTINCT i.id_inscripcion) as total_materias_cursadas,
                    COUNT(CASE WHEN i.estado = 'aprobado' THEN 1 END) as materias_aprobadas,
                    COUNT(CASE WHEN i.estado = 'reprobado' THEN 1 END) as materias_reprobadas,
                    COUNT(CASE WHEN i.estado = 'abandonado' THEN 1 END) as materias_abandonadas,
                    AVG(CASE WHEN n.tipo_evaluacion = 'final' AND i.estado = 'aprobado' THEN n.calificacion END) as promedio_general
                FROM inscripciones i
                LEFT JOIN notas n ON i.id_inscripcion = n.id_inscripcion
                WHERE i.id_estudiante = ?
            `;

            // Materias por gestión
            const materiasPorGestionQuery = `
                SELECT 
                    i.gestion,
                    COUNT(*) as total_materias,
                    COUNT(CASE WHEN i.estado = 'aprobado' THEN 1 END) as aprobadas,
                    COUNT(CASE WHEN i.estado = 'reprobado' THEN 1 END) as reprobadas,
                    AVG(CASE WHEN n.tipo_evaluacion = 'final' THEN n.calificacion END) as promedio_gestion
                FROM inscripciones i
                LEFT JOIN notas n ON i.id_inscripcion = n.id_inscripcion
                WHERE i.id_estudiante = ?
                GROUP BY i.gestion
                ORDER BY i.gestion DESC
            `;

            let queries = [
                executeQuery(resumenQuery, [id_estudiante]),
                executeQuery(materiasPorGestionQuery, [id_estudiante])
            ];

            let historialDetallado = [];
            if (incluir_historial === 'true') {
                const historialQuery = `
                    SELECT 
                        i.gestion,
                        m.nombre as materia,
                        m.sigla,
                        m.semestre,
                        i.paralelo,
                        i.estado,
                        n1.calificacion as parcial1,
                        n2.calificacion as parcial2,
                        nf.calificacion as final,
                        ns.calificacion as segunda_instancia,
                        d.nombre as docente_nombre,
                        d.apellido as docente_apellido
                    FROM inscripciones i
                    INNER JOIN materias m ON i.id_materia = m.id_materia
                    LEFT JOIN notas n1 ON i.id_inscripcion = n1.id_inscripcion AND n1.tipo_evaluacion = 'parcial1'
                    LEFT JOIN notas n2 ON i.id_inscripcion = n2.id_inscripcion AND n2.tipo_evaluacion = 'parcial2'
                    LEFT JOIN notas nf ON i.id_inscripcion = nf.id_inscripcion AND nf.tipo_evaluacion = 'final'
                    LEFT JOIN notas ns ON i.id_inscripcion = ns.id_inscripcion AND ns.tipo_evaluacion = 'segunda_instancia'
                    LEFT JOIN docente_materias dm ON m.id_materia = dm.id_materia 
                        AND i.gestion = dm.gestion AND i.paralelo = dm.paralelo
                    LEFT JOIN docentes d ON dm.id_docente = d.id_docente
                    WHERE i.id_estudiante = ?
                    ORDER BY i.gestion DESC, m.semestre ASC
                `;
                queries.push(executeQuery(historialQuery, [id_estudiante]));
            }

            const results = await Promise.all(queries);
            const [resumen, materiasPorGestion] = results;
            if (incluir_historial === 'true') {
                historialDetallado = results[2];
            }

            // Calcular porcentaje de avance
            const mencionInfo = await executeQuery(
                'SELECT materias_requeridas FROM menciones WHERE id_mencion = ?',
                [estudiante[0].id_mencion]
            );

            const materiasRequeridas = mencionInfo[0]?.materias_requeridas || 0;
            const porcentajeAvance = materiasRequeridas > 0 
                ? Math.round((resumen[0].materias_aprobadas / materiasRequeridas) * 100 * 100) / 100 
                : 0;

            // Auditar consulta
            await auditAction(req, 'reportes', 'SELECT', null, null, {
                tipo: 'reporte_rendimiento_estudiante',
                id_estudiante: parseInt(id_estudiante)
            });

            res.json({
                success: true,
                data: {
                    estudiante: estudiante[0],
                    resumen_academico: {
                        ...resumen[0],
                        promedio_general: resumen[0].promedio_general ? Math.round(resumen[0].promedio_general * 100) / 100 : null,
                        porcentaje_avance: porcentajeAvance,
                        materias_requeridas: materiasRequeridas
                    },
                    por_gestion: materiasPorGestion.map(item => ({
                        ...item,
                        promedio_gestion: item.promedio_gestion ? Math.round(item.promedio_gestion * 100) / 100 : null
                    })),
                    historial_detallado: incluir_historial === 'true' ? historialDetallado : null,
                    fecha_generacion: new Date().toISOString()
                }
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Reporte de materia específica
     */
    async reporteMateria(req, res, next) {
        try {
            const { id_materia } = req.params;
            const { gestion = new Date().getFullYear() } = req.query;

            // Información de la materia
            const materiaQuery = `
                SELECT 
                    m.*,
                    men.nombre as mencion_nombre
                FROM materias m
                LEFT JOIN menciones men ON m.id_mencion = men.id_mencion
                WHERE m.id_materia = ?
            `;

            const materia = await executeQuery(materiaQuery, [id_materia]);

            if (materia.length === 0) {
                throw createError(404, 'Materia no encontrada');
            }

            // Estadísticas de inscripciones
            const estadisticasQuery = `
                SELECT 
                    COUNT(*) as total_inscritos,
                    COUNT(CASE WHEN estado = 'aprobado' THEN 1 END) as aprobados,
                    COUNT(CASE WHEN estado = 'reprobado' THEN 1 END) as reprobados,
                    COUNT(CASE WHEN estado = 'abandonado' THEN 1 END) as abandonados,
                    COUNT(CASE WHEN estado = 'inscrito' THEN 1 END) as en_curso
                FROM inscripciones
                WHERE id_materia = ? AND gestion = ?
            `;

            // Estadísticas de notas
            const notasQuery = `
                SELECT 
                    n.tipo_evaluacion,
                    COUNT(*) as cantidad_notas,
                    AVG(n.calificacion) as promedio,
                    MIN(n.calificacion) as minima,
                    MAX(n.calificacion) as maxima,
                    COUNT(CASE WHEN n.calificacion >= 51 THEN 1 END) as aprobados_evaluacion
                FROM notas n
                INNER JOIN inscripciones i ON n.id_inscripcion = i.id_inscripcion
                WHERE i.id_materia = ? AND i.gestion = ?
                GROUP BY n.tipo_evaluacion
                ORDER BY 
                    CASE n.tipo_evaluacion
                        WHEN 'parcial1' THEN 1
                        WHEN 'parcial2' THEN 2
                        WHEN 'final' THEN 3
                        WHEN 'segunda_instancia' THEN 4
                    END
            `;

            // Lista de estudiantes inscritos
            const estudiantesQuery = `
                SELECT 
                    e.nombre,
                    e.apellido,
                    e.ci,
                    i.paralelo,
                    i.estado,
                    n1.calificacion as parcial1,
                    n2.calificacion as parcial2,
                    nf.calificacion as final,
                    ns.calificacion as segunda_instancia
                FROM inscripciones i
                INNER JOIN estudiantes e ON i.id_estudiante = e.id_estudiante
                LEFT JOIN notas n1 ON i.id_inscripcion = n1.id_inscripcion AND n1.tipo_evaluacion = 'parcial1'
                LEFT JOIN notas n2 ON i.id_inscripcion = n2.id_inscripcion AND n2.tipo_evaluacion = 'parcial2'
                LEFT JOIN notas nf ON i.id_inscripcion = nf.id_inscripcion AND nf.tipo_evaluacion = 'final'
                LEFT JOIN notas ns ON i.id_inscripcion = ns.id_inscripcion AND ns.tipo_evaluacion = 'segunda_instancia'
                WHERE i.id_materia = ? AND i.gestion = ?
                ORDER BY e.apellido, e.nombre
            `;

            // Docentes asignados
            const docentesQuery = `
                SELECT 
                    d.nombre,
                    d.apellido,
                    d.especialidad,
                    dm.paralelo
                FROM docente_materias dm
                INNER JOIN docentes d ON dm.id_docente = d.id_docente
                WHERE dm.id_materia = ? AND dm.gestion = ?
                ORDER BY dm.paralelo
            `;

            const [estadisticas, notas, estudiantes, docentes] = await Promise.all([
                executeQuery(estadisticasQuery, [id_materia, gestion]),
                executeQuery(notasQuery, [id_materia, gestion]),
                executeQuery(estudiantesQuery, [id_materia, gestion]),
                executeQuery(docentesQuery, [id_materia, gestion])
            ]);

            // Calcular porcentaje de aprobación
            const totalInscritos = estadisticas[0].total_inscritos;
            const porcentajeAprobacion = totalInscritos > 0 
                ? Math.round((estadisticas[0].aprobados / totalInscritos) * 100 * 100) / 100 
                : 0;

            // Auditar consulta
            await auditAction(req, 'reportes', 'SELECT', null, null, {
                tipo: 'reporte_materia',
                id_materia: parseInt(id_materia),
                gestion: parseInt(gestion)
            });

            res.json({
                success: true,
                data: {
                    materia: materia[0],
                    gestion: parseInt(gestion),
                    estadisticas_inscripciones: {
                        ...estadisticas[0],
                        porcentaje_aprobacion: porcentajeAprobacion
                    },
                    estadisticas_notas: notas.map(item => ({
                        ...item,
                        promedio: Math.round(item.promedio * 100) / 100
                    })),
                    docentes_asignados: docentes,
                    estudiantes_inscritos: estudiantes,
                    fecha_generacion: new Date().toISOString()
                }
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Reporte de docente
     */
    async reporteDocente(req, res, next) {
        try {
            const { id_docente } = req.params;
            const { gestion = new Date().getFullYear() } = req.query;

            // Información del docente
            const docenteQuery = `
                SELECT 
                    d.*,
                    u.correo
                FROM docentes d
                LEFT JOIN usuarios u ON d.id_usuario = u.id_usuario
                WHERE d.id_docente = ?
            `;

            const docente = await executeQuery(docenteQuery, [id_docente]);

            if (docente.length === 0) {
                throw createError(404, 'Docente no encontrado');
            }

            // Materias asignadas en la gestión
            const materiasQuery = `
                SELECT 
                    m.nombre as materia,
                    m.sigla,
                    m.semestre,
                    men.nombre as mencion,
                    dm.paralelo,
                    COUNT(i.id_inscripcion) as estudiantes_inscritos,
                    COUNT(CASE WHEN i.estado = 'aprobado' THEN 1 END) as estudiantes_aprobados,
                    AVG(CASE WHEN n.tipo_evaluacion = 'final' THEN n.calificacion END) as promedio_materia
                FROM docente_materias dm
                INNER JOIN materias m ON dm.id_materia = m.id_materia
                LEFT JOIN menciones men ON m.id_mencion = men.id_mencion
                LEFT JOIN inscripciones i ON m.id_materia = i.id_materia 
                    AND i.gestion = dm.gestion AND i.paralelo = dm.paralelo
                LEFT JOIN notas n ON i.id_inscripcion = n.id_inscripcion AND n.id_docente = dm.id_docente
                WHERE dm.id_docente = ? AND dm.gestion = ?
                GROUP BY dm.id_materia, dm.paralelo
                ORDER BY m.semestre, m.nombre
            `;

            // Estadísticas de notas registradas
            const notasRegistradasQuery = `
                SELECT 
                    n.tipo_evaluacion,
                    COUNT(*) as cantidad_registrada,
                    AVG(n.calificacion) as promedio_tipo
                FROM notas n
                INNER JOIN inscripciones i ON n.id_inscripcion = i.id_inscripcion
                WHERE n.id_docente = ? AND i.gestion = ?
                GROUP BY n.tipo_evaluacion
                ORDER BY 
                    CASE n.tipo_evaluacion
                        WHEN 'parcial1' THEN 1
                        WHEN 'parcial2' THEN 2
                        WHEN 'final' THEN 3
                        WHEN 'segunda_instancia' THEN 4
                    END
            `;

            // Carga académica histórica
            const cargaHistoricaQuery = `
                SELECT 
                    dm.gestion,
                    COUNT(DISTINCT dm.id_materia) as materias_asignadas,
                    COUNT(DISTINCT CONCAT(dm.id_materia, '-', dm.paralelo)) as paralelos_asignados
                FROM docente_materias dm
                WHERE dm.id_docente = ?
                GROUP BY dm.gestion
                ORDER BY dm.gestion DESC
                LIMIT 5
            `;

            const [materias, notasRegistradas, cargaHistorica] = await Promise.all([
                executeQuery(materiasQuery, [id_docente, gestion]),
                executeQuery(notasRegistradasQuery, [id_docente, gestion]),
                executeQuery(cargaHistoricaQuery, [id_docente])
            ]);

            // Calcular resumen
            const totalEstudiantes = materias.reduce((sum, m) => sum + m.estudiantes_inscritos, 0);
            const totalAprobados = materias.reduce((sum, m) => sum + m.estudiantes_aprobados, 0);
            const promedioGeneral = materias.length > 0 
                ? materias.reduce((sum, m) => sum + (m.promedio_materia || 0), 0) / materias.length 
                : 0;

            // Auditar consulta
            await auditAction(req, 'reportes', 'SELECT', null, null, {
                tipo: 'reporte_docente',
                id_docente: parseInt(id_docente),
                gestion: parseInt(gestion)
            });

            res.json({
                success: true,
                data: {
                    docente: docente[0],
                    gestion: parseInt(gestion),
                    resumen: {
                        materias_asignadas: materias.length,
                        total_estudiantes: totalEstudiantes,
                        total_aprobados: totalAprobados,
                        porcentaje_aprobacion: totalEstudiantes > 0 ? Math.round((totalAprobados / totalEstudiantes) * 100 * 100) / 100 : 0,
                        promedio_general: Math.round(promedioGeneral * 100) / 100
                    },
                    materias_asignadas: materias.map(item => ({
                        ...item,
                        promedio_materia: item.promedio_materia ? Math.round(item.promedio_materia * 100) / 100 : null,
                        porcentaje_aprobacion: item.estudiantes_inscritos > 0 
                            ? Math.round((item.estudiantes_aprobados / item.estudiantes_inscritos) * 100 * 100) / 100 
                            : 0
                    })),
                    notas_registradas: notasRegistradas.map(item => ({
                        ...item,
                        promedio_tipo: Math.round(item.promedio_tipo * 100) / 100
                    })),
                    carga_historica: cargaHistorica,
                    fecha_generacion: new Date().toISOString()
                }
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Reporte de estadísticas por mención
     */
    async reporteMencion(req, res, next) {
        try {
            const { id_mencion } = req.params;
            const { gestion = new Date().getFullYear() } = req.query;

            // Información de la mención
            const mencionQuery = `
                SELECT * FROM menciones WHERE id_mencion = ?
            `;

            const mencion = await executeQuery(mencionQuery, [id_mencion]);

            if (mencion.length === 0) {
                throw createError(404, 'Mención no encontrada');
            }

            // Estadísticas de estudiantes
            const estudiantesQuery = `
                SELECT 
                    COUNT(*) as total_estudiantes,
                    COUNT(CASE WHEN estado_academico = 'activo' THEN 1 END) as activos,
                    COUNT(CASE WHEN estado_academico = 'graduado' THEN 1 END) as graduados,
                    COUNT(CASE WHEN estado_academico = 'suspendido' THEN 1 END) as suspendidos
                FROM estudiantes
                WHERE id_mencion = ?
            `;

            // Rendimiento por semestre
            const rendimientoPorSemestreQuery = `
                SELECT 
                    m.semestre,
                    COUNT(DISTINCT i.id_inscripcion) as total_inscripciones,
                    COUNT(CASE WHEN i.estado = 'aprobado' THEN 1 END) as aprobadas,
                    AVG(CASE WHEN n.tipo_evaluacion = 'final' THEN n.calificacion END) as promedio_semestre
                FROM materias m
                LEFT JOIN inscripciones i ON m.id_materia = i.id_materia AND i.gestion = ?
                LEFT JOIN notas n ON i.id_inscripcion = n.id_inscripcion
                WHERE m.id_mencion = ? AND m.activo = TRUE
                GROUP BY m.semestre
                ORDER BY m.semestre
            `;

            // Top estudiantes
            const topEstudiantesQuery = `
                SELECT 
                    e.nombre,
                    e.apellido,
                    e.ci,
                    AVG(CASE WHEN n.tipo_evaluacion = 'final' THEN n.calificacion END) as promedio_general,
                    COUNT(CASE WHEN i.estado = 'aprobado' THEN 1 END) as materias_aprobadas
                FROM estudiantes e
                LEFT JOIN inscripciones i ON e.id_estudiante = i.id_estudiante
                LEFT JOIN notas n ON i.id_inscripcion = n.id_inscripcion
                WHERE e.id_mencion = ? AND e.estado_academico = 'activo'
                GROUP BY e.id_estudiante
                HAVING promedio_general IS NOT NULL
                ORDER BY promedio_general DESC, materias_aprobadas DESC
                LIMIT 10
            `;

            const [estudiantes, rendimientoPorSemestre, topEstudiantes] = await Promise.all([
                executeQuery(estudiantesQuery, [id_mencion]),
                executeQuery(rendimientoPorSemestreQuery, [gestion, id_mencion]),
                executeQuery(topEstudiantesQuery, [id_mencion])
            ]);

            // Auditar consulta
            await auditAction(req, 'reportes', 'SELECT', null, null, {
                tipo: 'reporte_mencion',
                id_mencion: parseInt(id_mencion),
                gestion: parseInt(gestion)
            });

            res.json({
                success: true,
                data: {
                    mencion: mencion[0],
                    gestion: parseInt(gestion),
                    estadisticas_estudiantes: estudiantes[0],
                    rendimiento_por_semestre: rendimientoPorSemestre.map(item => ({
                        ...item,
                        promedio_semestre: item.promedio_semestre ? Math.round(item.promedio_semestre * 100) / 100 : null,
                        porcentaje_aprobacion: item.total_inscripciones > 0 
                            ? Math.round((item.aprobadas / item.total_inscripciones) * 100 * 100) / 100 
                            : 0
                    })),
                    top_estudiantes: topEstudiantes.map(item => ({
                        ...item,
                        promedio_general: Math.round(item.promedio_general * 100) / 100
                    })),
                    fecha_generacion: new Date().toISOString()
                }
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Exportar reporte a CSV (funcionalidad básica)
     */
    async exportarCSV(req, res, next) {
        try {
            const { tipo, id = '', gestion = new Date().getFullYear() } = req.query;

            let data = [];
            let filename = '';

            switch (tipo) {
                case 'estudiantes':
                    const estudiantes = await executeQuery(`
                        SELECT 
                            e.ci, e.nombre, e.apellido, e.estado_academico,
                            men.nombre as mencion, e.fecha_ingreso
                        FROM estudiantes e
                        LEFT JOIN menciones men ON e.id_mencion = men.id_mencion
                        ORDER BY e.apellido, e.nombre
                    `);
                    data = estudiantes;
                    filename = 'estudiantes.csv';
                    break;

                case 'notas':
                    if (!id) throw createError(400, 'Se requiere ID de materia para exportar notas');
                    const notas = await executeQuery(`
                        SELECT 
                            e.ci, e.nombre, e.apellido, i.paralelo,
                            n1.calificacion as parcial1,
                            n2.calificacion as parcial2,
                            nf.calificacion as final,
                            i.estado
                        FROM inscripciones i
                        INNER JOIN estudiantes e ON i.id_estudiante = e.id_estudiante
                        LEFT JOIN notas n1 ON i.id_inscripcion = n1.id_inscripcion AND n1.tipo_evaluacion = 'parcial1'
                        LEFT JOIN notas n2 ON i.id_inscripcion = n2.id_inscripcion AND n2.tipo_evaluacion = 'parcial2'
                        LEFT JOIN notas nf ON i.id_inscripcion = nf.id_inscripcion AND nf.tipo_evaluacion = 'final'
                        WHERE i.id_materia = ? AND i.gestion = ?
                        ORDER BY e.apellido, e.nombre
                    `, [id, gestion]);
                    data = notas;
                    filename = `notas_materia_${id}_${gestion}.csv`;
                    break;

                default:
                    throw createError(400, 'Tipo de reporte no válido');
            }

            // Convertir a CSV básico
            if (data.length === 0) {
                throw createError(404, 'No hay datos para exportar');
            }

            const headers = Object.keys(data[0]);
            let csv = headers.join(',') + '\n';
            
            data.forEach(row => {
                const values = headers.map(header => {
                    const value = row[header];
                    return value !== null && value !== undefined ? `"${value}"` : '""';
                });
                csv += values.join(',') + '\n';
            });

            // Auditar exportación
            await auditAction(req, 'reportes', 'EXPORT', null, null, {
                tipo: 'exportar_csv',
                tipo_reporte: tipo,
                registros: data.length
            });

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.send(csv);

        } catch (error) {
            next(error);
        }
    }
}

const controller = new ReporteController();

module.exports = {
    // Funciones que existen en la clase
    reporteGeneral: controller.reporteGeneral.bind(controller),
    reporteRendimientoEstudiante: controller.reporteRendimientoEstudiante.bind(controller),
    reporteMateria: controller.reporteMateria.bind(controller),
    reporteDocente: controller.reporteDocente.bind(controller),
    reporteMencion: controller.reporteMencion.bind(controller),
    exportarCSV: controller.exportarCSV.bind(controller),
    
    // Funciones adicionales que pueden faltar
    reporteEstudiantes: async (req, res, next) => {
        try {
            const query = `
                SELECT 
                    e.id_estudiante,
                    e.ci,
                    e.nombre,
                    e.apellido,
                    e.estado_academico,
                    men.nombre as mencion,
                    e.fecha_ingreso,
                    COUNT(CASE WHEN i.estado = 'aprobado' THEN 1 END) as materias_aprobadas
                FROM estudiantes e
                LEFT JOIN menciones men ON e.id_mencion = men.id_mencion
                LEFT JOIN inscripciones i ON e.id_estudiante = i.id_estudiante
                GROUP BY e.id_estudiante
                ORDER BY e.apellido, e.nombre
            `;
            const estudiantes = await executeQuery(query);
            res.json({ success: true, data: estudiantes });
        } catch (error) {
            next(error);
        }
    },
    
    reporteDocentes: async (req, res, next) => {
        try {
            const query = `
                SELECT 
                    d.id_docente,
                    d.ci,
                    d.nombre,
                    d.apellido,
                    d.especialidad,
                    d.activo,
                    COUNT(DISTINCT dm.id_materia) as materias_asignadas
                FROM docentes d
                LEFT JOIN docente_materias dm ON d.id_docente = dm.id_docente
                GROUP BY d.id_docente
                ORDER BY d.apellido, d.nombre
            `;
            const docentes = await executeQuery(query);
            res.json({ success: true, data: docentes });
        } catch (error) {
            next(error);
        }
    },
    
    reporteMaterias: async (req, res, next) => {
        try {
            const query = `
                SELECT 
                    m.id_materia,
                    m.nombre,
                    m.sigla,
                    m.semestre,
                    men.nombre as mencion,
                    COUNT(i.id_inscripcion) as total_inscripciones
                FROM materias m
                LEFT JOIN menciones men ON m.id_mencion = men.id_mencion
                LEFT JOIN inscripciones i ON m.id_materia = i.id_materia
                WHERE m.activo = TRUE
                GROUP BY m.id_materia
                ORDER BY men.nombre, m.semestre, m.nombre
            `;
            const materias = await executeQuery(query);
            res.json({ success: true, data: materias });
        } catch (error) {
            next(error);
        }
    },
    
    reporteInscripciones: async (req, res, next) => {
        try {
            const { gestion = new Date().getFullYear() } = req.query;
            const query = `
                SELECT 
                    i.gestion,
                    COUNT(*) as total_inscripciones,
                    COUNT(CASE WHEN i.estado = 'aprobado' THEN 1 END) as aprobadas,
                    COUNT(CASE WHEN i.estado = 'reprobado' THEN 1 END) as reprobadas,
                    COUNT(CASE WHEN i.estado = 'inscrito' THEN 1 END) as en_curso
                FROM inscripciones i
                WHERE i.gestion = ?
                GROUP BY i.gestion
            `;
            const inscripciones = await executeQuery(query, [gestion]);
            res.json({ success: true, data: inscripciones });
        } catch (error) {
            next(error);
        }
    },
    
    reporteNotas: async (req, res, next) => {
        try {
            const { gestion = new Date().getFullYear() } = req.query;
            const query = `
                SELECT 
                    n.tipo_evaluacion,
                    COUNT(*) as total_notas,
                    AVG(n.calificacion) as promedio,
                    MIN(n.calificacion) as minima,
                    MAX(n.calificacion) as maxima
                FROM notas n
                INNER JOIN inscripciones i ON n.id_inscripcion = i.id_inscripcion
                WHERE i.gestion = ?
                GROUP BY n.tipo_evaluacion
            `;
            const notas = await executeQuery(query, [gestion]);
            res.json({ success: true, data: notas });
        } catch (error) {
            next(error);
        }
    },
    
    reporteRendimientoAcademico: async (req, res, next) => {
        try {
            const { gestion = new Date().getFullYear() } = req.query;
            const query = `
                SELECT 
                    men.nombre as mencion,
                    COUNT(DISTINCT e.id_estudiante) as total_estudiantes,
                    AVG(CASE WHEN n.tipo_evaluacion = 'final' THEN n.calificacion END) as promedio_general
                FROM menciones men
                LEFT JOIN estudiantes e ON men.id_mencion = e.id_mencion
                LEFT JOIN inscripciones i ON e.id_estudiante = i.id_estudiante AND i.gestion = ?
                LEFT JOIN notas n ON i.id_inscripcion = n.id_inscripcion
                WHERE men.activo = TRUE
                GROUP BY men.id_mencion
                ORDER BY promedio_general DESC
            `;
            const rendimiento = await executeQuery(query, [gestion]);
            res.json({ success: true, data: rendimiento });
        } catch (error) {
            next(error);
        }
    },
    
    exportarReporte: async (req, res, next) => {
        try {
            res.json({ 
                success: false, 
                message: 'Funcionalidad de exportación no implementada aún' 
            });
        } catch (error) {
            next(error);
        }
    }
};
