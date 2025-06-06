const { executeQuery } = require('../config/database');
const { createError } = require('../middleware/errorHandler');
const { auditAction } = require('../middleware/audit-complete');

/**
 * Controlador para gestión de notas
 */
class NotaController {

    /**
     * Listar notas con paginación y filtros
     */
    async listarNotas(req, res, next) {
        try {
            const {
                page = 1,
                limit = 10,
                estudiante = '',
                materia = '',
                docente = '',
                gestion = '',
                id_tipo_evaluacion = '',
                sortBy = 'fecha_registro',
                sortOrder = 'DESC'
            } = req.query;

            const offset = (parseInt(page) - 1) * parseInt(limit);
            const limitNum = Math.min(parseInt(limit), 100);

            // Construir condiciones WHERE
            let whereConditions = ['n.id_nota IS NOT NULL'];
            let queryParams = [];

            if (estudiante) {
                whereConditions.push('(e.nombre LIKE ? OR e.apellido LIKE ? OR e.ci LIKE ?)');
                const searchTerm = `%${estudiante}%`;
                queryParams.push(searchTerm, searchTerm, searchTerm);
            }

            if (materia) {
                whereConditions.push('(m.nombre LIKE ? OR m.sigla LIKE ?)');
                const searchTerm = `%${materia}%`;
                queryParams.push(searchTerm, searchTerm);
            }

            if (docente) {
                whereConditions.push('(d.nombre LIKE ? OR d.apellido LIKE ?)');
                const searchTerm = `%${docente}%`;
                queryParams.push(searchTerm, searchTerm);
            }

            if (gestion) {
                whereConditions.push('i.gestion = ?');
                queryParams.push(gestion);
            }

            if (req.query.estado) {
                whereConditions.push('CASE WHEN n.calificacion >= 51 THEN "aprobado" ELSE "reprobado" END = ?');
                queryParams.push(req.query.estado);
            }

            if (id_tipo_evaluacion) {
                whereConditions.push('n.id_tipo_evaluacion = ?');
                queryParams.push(id_tipo_evaluacion);
            }

            const whereClause = whereConditions.join(' AND ');

            // Consulta principal con JOINs
            const query = `
                SELECT 
                    n.id_nota,
                    n.calificacion AS nota_final,
                    n.fecha_registro,
                    n.observaciones,
                    i.id_inscripcion,
                    i.gestion,
                    i.paralelo,
                    i.estado,
                    e.id_estudiante,
                    e.nombre as estudiante_nombre,
                    e.apellido as estudiante_apellido,
                    e.ci as estudiante_ci,
                    m.id_materia,
                    m.nombre as materia_nombre,
                    m.sigla as materia_sigla,
                    m.semestre,
                    men.nombre as mencion_nombre,
                    d.id_docente,
                    d.nombre as docente_nombre,
                    d.apellido as docente_apellido,
                    te.nombre as tipo_evaluacion_nombre
                FROM notas n
                INNER JOIN inscripciones i ON n.id_inscripcion = i.id_inscripcion
                INNER JOIN estudiantes e ON i.id_estudiante = e.id_estudiante
                INNER JOIN materias m ON i.id_materia = m.id_materia
                LEFT JOIN menciones men ON m.id_mencion = men.id_mencion
                INNER JOIN docentes d ON n.id_docente = d.id_docente
                INNER JOIN tipos_evaluacion te ON n.id_tipo_evaluacion = te.id_tipo_evaluacion
                WHERE ${whereClause}
                ORDER BY n.${sortBy} ${sortOrder}
                LIMIT ${limitNum} OFFSET ${offset}
            `;

            // Consulta para contar total
            const countQuery = `
                SELECT COUNT(DISTINCT n.id_nota) as total
                FROM notas n
                INNER JOIN inscripciones i ON n.id_inscripcion = i.id_inscripcion
                INNER JOIN estudiantes e ON i.id_estudiante = e.id_estudiante
                INNER JOIN materias m ON i.id_materia = m.id_materia
                LEFT JOIN menciones men ON m.id_mencion = men.id_mencion
                INNER JOIN docentes d ON n.id_docente = d.id_docente
                WHERE ${whereClause}
            `;

            const [notas, countResult] = await Promise.all([
                executeQuery(query, queryParams),
                executeQuery(countQuery, queryParams)
            ]);

            const total = countResult[0].total;
            const totalPages = Math.ceil(total / limitNum);

            res.json({
                success: true,
                data: notas,
                pagination: {
                    page: parseInt(page),
                    limit: limitNum,
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtener nota por ID
     */
    async obtenerNota(req, res, next) {
        try {
            const { id } = req.params;

            const query = `
                SELECT 
                    n.*,
                    i.gestion,
                    i.paralelo,
                    i.estado as estado_inscripcion,
                    e.nombre as estudiante_nombre,
                    e.apellido as estudiante_apellido,
                    e.ci as estudiante_ci,
                    m.nombre as materia_nombre,
                    m.sigla as materia_sigla,
                    m.semestre,
                    men.nombre as mencion_nombre,
                    d.nombre as docente_nombre,
                    d.apellido as docente_apellido,
                    d.especialidad as docente_especialidad,
                    te.nombre as tipo_evaluacion_nombre,
                    te.porcentaje as tipo_evaluacion_porcentaje
                FROM notas n
                INNER JOIN inscripciones i ON n.id_inscripcion = i.id_inscripcion
                INNER JOIN estudiantes e ON i.id_estudiante = e.id_estudiante
                INNER JOIN materias m ON i.id_materia = m.id_materia
                LEFT JOIN menciones men ON m.id_mencion = men.id_mencion
                INNER JOIN docentes d ON n.id_docente = d.id_docente
                INNER JOIN tipos_evaluacion te ON n.id_tipo_evaluacion = te.id_tipo_evaluacion
                WHERE n.id_nota = ?
            `;

            const notas = await executeQuery(query, [id]);

            if (notas.length === 0) {
                throw createError('Nota no encontrada', 404);
            }

            res.json({
                success: true,
                data: notas[0]
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Registrar nueva nota
     */
    async registrarNota(req, res, next) {
        try {
            const {
                id_inscripcion,
                calificacion,
                id_tipo_evaluacion,
                observaciones = ''
            } = req.body;

            const id_docente = req.user.docente_id; // Asumiendo que el docente está en el token
            const isAdmin = req.user.roles.some(role => role.nombre === 'administrador');

            // Verificar que la inscripción existe
            const inscripcionExistente = await executeQuery(
                'SELECT * FROM inscripciones WHERE id_inscripcion = ?',
                [id_inscripcion]
            );

            if (inscripcionExistente.length === 0) {
                throw createError('Inscripción no encontrada', 404);
            }

            // Verificar que la inscripción corresponde al paralelo asignado al docente
            const inscripcionInfo = await executeQuery(`
                SELECT i.*, m.id_materia, m.nombre as materia_nombre 
                FROM inscripciones i
                INNER JOIN materias m ON i.id_materia = m.id_materia
                WHERE i.id_inscripcion = ?
            `, [id_inscripcion]);

            if (inscripcionInfo.length === 0) {
                throw createError('Inscripción no encontrada', 404);
            }

            // Verificar asignación del docente al paralelo específico, solo si no es admin
            if (!isAdmin) {
                const asignacionDocente = await executeQuery(`
                    SELECT dm.* FROM docente_materias dm
                    WHERE dm.id_materia = ? 
                    AND dm.id_docente = ?
                    AND dm.gestion = ?
                    AND dm.paralelo = ?
                `, [
                    inscripcionInfo[0].id_materia,
                    id_docente,
                    inscripcionInfo[0].gestion,
                    inscripcionInfo[0].paralelo
                ]);

                if (asignacionDocente.length === 0) {
                    throw createError(`No tiene permisos para registrar notas en el paralelo ${inscripcionInfo[0].paralelo} de la materia ${inscripcionInfo[0].materia_nombre}`, 403);
                }
            }

            // Verificar que no exista ya una nota del mismo tipo para esta inscripción
            const notaExistente = await executeQuery(
                'SELECT id_nota FROM notas WHERE id_inscripcion = ? AND id_tipo_evaluacion = ?',
                [id_inscripcion, id_tipo_evaluacion]
            );

            if (notaExistente.length > 0) {
                throw createError(`Ya existe una nota para este tipo de evaluación en esta inscripción`, 409);
            }

            // Validar calificación
            const calificacionNum = parseFloat(calificacion);
            if (isNaN(calificacionNum) || calificacionNum < 0 || calificacionNum > 100) {
                throw createError('La calificación debe ser un número entre 0 y 100', 400);
            }

            // Redondear a 2 decimales
            const calificacionFinal = Math.round(calificacionNum * 100) / 100;

            // Registrar nota
            const query = `
                INSERT INTO notas (
                    id_inscripcion, calificacion, id_tipo_evaluacion, 
                    id_docente, observaciones
                ) VALUES (?, ?, ?, ?, ?)
            `;

            const result = await executeQuery(query, [
                id_inscripcion, calificacionFinal, id_tipo_evaluacion,
                id_docente, observaciones
            ]);

            // Obtener información del tipo de evaluación
            const tipoEvaluacion = await executeQuery(
                'SELECT * FROM tipos_evaluacion WHERE id_tipo_evaluacion = ?',
                [id_tipo_evaluacion]
            );

            // Actualizar estado de inscripción si es evaluación final
            if (tipoEvaluacion[0].nombre.toLowerCase().includes('final')) {
                const nuevoEstado = calificacion >= 51 ? 'aprobado' : 'reprobado';
                await executeQuery(
                    'UPDATE inscripciones SET estado = ? WHERE id_inscripcion = ?',
                    [nuevoEstado, id_inscripcion]
                );
            }

            // Auditar acción
            await auditAction(req, 'notas', 'INSERT', result.insertId, null, {
                id_inscripcion, calificacion, id_tipo_evaluacion, id_docente
            });

            res.status(201).json({
                success: true,
                message: 'Nota registrada exitosamente',
                data: {
                    id_nota: result.insertId,
                    id_inscripcion: parseInt(id_inscripcion),
                    calificacion: parseFloat(calificacionFinal),
                    id_tipo_evaluacion: parseInt(id_tipo_evaluacion),
                    id_docente: parseInt(id_docente)
                }
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Actualizar nota existente
     */
    async actualizarNota(req, res, next) {
        try {
            const { id } = req.params;
            const { calificacion, observaciones } = req.body;
            const id_docente = req.user.docente_id;

            // Verificar que la nota existe
            const notaExistente = await executeQuery(
                'SELECT * FROM notas WHERE id_nota = ?',
                [id]
            );

            if (notaExistente.length === 0) {
                throw createError('Nota no encontrada', 404);
            }

            const datosAnteriores = notaExistente[0];

            // Verificar que el docente puede modificar esta nota
            const isAdmin = req.user.roles.some(role => role.nombre === 'administrador');
            if (datosAnteriores.id_docente !== id_docente && !isAdmin) {
                throw createError('No tiene permisos para modificar esta nota', 403);
            }

            // Validar calificación
            if (calificacion !== undefined && (calificacion < 0 || calificacion > 100)) {
                throw createError('La calificación debe estar entre 0 y 100', 400);
            }

            // Actualizar nota
            let updateFields = [];
            let updateParams = [];

            if (calificacion !== undefined) {
                updateFields.push('calificacion = ?');
                updateParams.push(calificacion);
            }

            if (observaciones !== undefined) {
                updateFields.push('observaciones = ?');
                updateParams.push(observaciones);
            }

            if (updateFields.length === 0) {
                throw createError('No hay campos para actualizar', 400);
            }

            updateFields.push('fecha_actualizacion = CURRENT_TIMESTAMP');
            updateParams.push(id);

            const query = `
                UPDATE notas SET ${updateFields.join(', ')}
                WHERE id_nota = ?
            `;

            await executeQuery(query, updateParams);

            // Actualizar estado de inscripción si es nota final y cambió la calificación
            // Obtener información del tipo de evaluación
            const tipoEvaluacion = await executeQuery(
                'SELECT * FROM tipos_evaluacion WHERE id_tipo_evaluacion = ?',
                [datosAnteriores.id_tipo_evaluacion]
            );

            if (tipoEvaluacion[0].nombre.toLowerCase().includes('final') && calificacion !== undefined) {
                const nuevoEstado = calificacion >= 51 ? 'aprobado' : 'reprobado';
                await executeQuery(
                    'UPDATE inscripciones SET estado = ? WHERE id_inscripcion = ?',
                    [nuevoEstado, datosAnteriores.id_inscripcion]
                );
            }

            // Auditar acción
            await auditAction(req, 'notas', 'UPDATE', id, datosAnteriores, {
                calificacion, observaciones
            });

            res.json({
                success: true,
                message: 'Nota actualizada exitosamente',
                data: {
                    id_nota: parseInt(id),
                    calificacion: calificacion || datosAnteriores.calificacion,
                    observaciones: observaciones || datosAnteriores.observaciones
                }
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Eliminar nota
     */
    async eliminarNota(req, res, next) {
        try {
            const { id } = req.params;
            const id_docente = req.user.docente_id;

            // Verificar que la nota existe
            const notaExistente = await executeQuery(
                'SELECT * FROM notas WHERE id_nota = ?',
                [id]
            );

            if (notaExistente.length === 0) {
                throw createError('Nota no encontrada', 404);
            }

            // Verificar permisos
            const isAdmin = req.user.roles.some(role => role.nombre === 'administrador');
            if (notaExistente[0].id_docente !== id_docente && !isAdmin) {
                throw createError('No tiene permisos para eliminar esta nota', 403);
            }

            // Eliminar nota
            const query = 'DELETE FROM notas WHERE id_nota = ?';
            await executeQuery(query, [id]);

            // Si era nota final, actualizar estado de inscripción
            // Obtener información del tipo de evaluación
            const tipoEvaluacion = await executeQuery(
                'SELECT * FROM tipos_evaluacion WHERE id_tipo_evaluacion = ?',
                [notaExistente[0].id_tipo_evaluacion]
            );

            if (tipoEvaluacion[0].nombre.toLowerCase().includes('final')) {
                await executeQuery(
                    'UPDATE inscripciones SET estado = "inscrito" WHERE id_inscripcion = ?',
                    [notaExistente[0].id_inscripcion]
                );
            }

            // Auditar acción
            await auditAction(req, 'notas', 'DELETE', id, notaExistente[0], null);

            res.json({
                success: true,
                message: 'Nota eliminada exitosamente'
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtener notas de una inscripción
     */
    async obtenerNotasPorInscripcion(req, res, next) {
        try {
            const { id_inscripcion } = req.params;

            // Verificar que la inscripción existe
            const inscripcionExistente = await executeQuery(
                'SELECT * FROM inscripciones WHERE id_inscripcion = ?',
                [id_inscripcion]
            );

            if (inscripcionExistente.length === 0) {
                throw createError('Inscripción no encontrada', 404);
            }

            const query = `
                SELECT 
                    n.*,
                    d.nombre as docente_nombre,
                    d.apellido as docente_apellido,
                    te.nombre as tipo_evaluacion_nombre,
                    te.porcentaje as tipo_evaluacion_porcentaje,
                    te.orden
                FROM notas n
                INNER JOIN docentes d ON n.id_docente = d.id_docente
                INNER JOIN tipos_evaluacion te ON n.id_tipo_evaluacion = te.id_tipo_evaluacion
                WHERE n.id_inscripcion = ?
                ORDER BY te.orden ASC
            `;

            const notas = await executeQuery(query, [id_inscripcion]);

            // Calcular promedio si hay notas
            let promedio = null;
            if (notas.length > 0) {
                const notaFinal = notas.find(n => n.tipo_evaluacion_nombre.toLowerCase().includes('final'));
                if (notaFinal) {
                    promedio = notaFinal.calificacion;
                } else {
                    // Calcular promedio de parciales si no hay final
                    const parciales = notas.filter(n => n.tipo_evaluacion_nombre.toLowerCase().includes('parcial'));
                    if (parciales.length > 0) {
                        promedio = parciales.reduce((sum, n) => sum + n.calificacion, 0) / parciales.length;
                    }
                }
            }

            res.json({
                success: true,
                data: {
                    id_inscripcion: parseInt(id_inscripcion),
                    notas: notas,
                    promedio: promedio ? Math.round(promedio * 100) / 100 : null,
                    estado_calculado: promedio >= 51 ? 'aprobado' : 'reprobado'
                }
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtener estadísticas de notas
     */
    async obtenerEstadisticas(req, res, next) {
        try {
            const { gestion = new Date().getFullYear(), id_materia = '', id_tipo_evaluacion = '' } = req.query;

            let whereConditions = ['i.gestion = ?'];
            let queryParams = [gestion];

            if (id_materia) {
                whereConditions.push('i.id_materia = ?');
                queryParams.push(id_materia);
            }

            if (id_tipo_evaluacion) {
                whereConditions.push('n.id_tipo_evaluacion = ?');
                queryParams.push(id_tipo_evaluacion);
            }

            const whereClause = whereConditions.join(' AND ');

            const estadisticasQuery = `
                SELECT 
                    COUNT(*) as total_notas,
                    AVG(n.calificacion) as promedio_general,
                    MIN(n.calificacion) as nota_minima,
                    MAX(n.calificacion) as nota_maxima,
                    COUNT(CASE WHEN n.calificacion >= 51 THEN 1 END) as aprobados,
                    COUNT(CASE WHEN n.calificacion < 51 THEN 1 END) as reprobados
                FROM notas n
                INNER JOIN inscripciones i ON n.id_inscripcion = i.id_inscripcion
                WHERE ${whereClause}
            `;

            const porTipoQuery = `
                SELECT 
                    te.nombre as tipo_evaluacion_nombre,
                    COUNT(*) as cantidad,
                    AVG(n.calificacion) as promedio,
                    MIN(n.calificacion) as minima,
                    MAX(n.calificacion) as maxima
                FROM notas n
                INNER JOIN inscripciones i ON n.id_inscripcion = i.id_inscripcion
                INNER JOIN tipos_evaluacion te ON n.id_tipo_evaluacion = te.id_tipo_evaluacion
                WHERE ${whereClause}
                GROUP BY te.id_tipo_evaluacion, te.nombre
                ORDER BY te.orden ASC
            `;

            const distribucionQuery = `
                SELECT 
                    CASE 
                        WHEN n.calificacion >= 90 THEN '90-100'
                        WHEN n.calificacion >= 80 THEN '80-89'
                        WHEN n.calificacion >= 70 THEN '70-79'
                        WHEN n.calificacion >= 60 THEN '60-69'
                        WHEN n.calificacion >= 51 THEN '51-59'
                        ELSE '0-50'
                    END as rango,
                    COUNT(*) as cantidad
                FROM notas n
                INNER JOIN inscripciones i ON n.id_inscripcion = i.id_inscripcion
                WHERE ${whereClause}
                GROUP BY rango
                ORDER BY MIN(n.calificacion) DESC
            `;

            const [estadisticas, porTipo, distribucion] = await Promise.all([
                executeQuery(estadisticasQuery, queryParams),
                executeQuery(porTipoQuery, queryParams),
                executeQuery(distribucionQuery, queryParams)
            ]);

            res.json({
                success: true,
                data: {
                    gestion: parseInt(gestion),
                    filtros: { id_materia, id_tipo_evaluacion },
                    resumen: {
                        ...estadisticas[0],
                        promedio_general: Math.round(estadisticas[0].promedio_general * 100) / 100,
                        porcentaje_aprobacion: Math.round((estadisticas[0].aprobados / estadisticas[0].total_notas) * 100 * 100) / 100
                    },
                    por_tipo_evaluacion: porTipo.map(item => ({
                        tipo_evaluacion: item.tipo_evaluacion_nombre,
                        cantidad: item.cantidad,
                        promedio: Math.round(item.promedio * 100) / 100,
                        minima: item.minima,
                        maxima: item.maxima
                    })),
                    distribucion_notas: distribucion
                }
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Registro masivo de notas (para docentes)
     */
    async registroMasivo(req, res, next) {
        try {
            const { notas, paralelos } = req.body;

            // Validar usuario y permisos
            const isAdmin = req.user?.roles?.some(role => role.nombre === 'administrador') || false;
            const id_docente = req.user?.id_docente || req.user?.docente_id || null;

            // Validar paralelos seleccionados
            if (!Array.isArray(paralelos) || paralelos.length === 0) {
                throw createError('Debe seleccionar al menos un paralelo', 400);
            }

            if (!isAdmin && !id_docente) {
                throw createError('No se pudo identificar al docente', 401);
            }

            if (!Array.isArray(notas) || notas.length === 0) {
                throw createError('Se requiere un array de notas', 400);
            }

            const resultados = {
                exitosas: 0,
                fallidas: 0,
                errores: []
            };

            // Agrupar notas por inscripción para calcular nota final
            const notasPorInscripcion = {};

            // Procesar cada nota
            for (const nota of notas) {
                try {
                    const { id_inscripcion, calificacion, id_tipo_evaluacion, observaciones = '' } = nota;

                    // Verificar que la inscripción pertenece a los paralelos seleccionados
                    const inscripcionParalelo = await executeQuery(
                        'SELECT paralelo FROM inscripciones WHERE id_inscripcion = ?',
                        [id_inscripcion]
                    );

                    if (inscripcionParalelo.length === 0 || !paralelos.includes(inscripcionParalelo[0].paralelo)) {
                        continue; // Saltar esta nota si no pertenece a los paralelos seleccionados
                    }

                    // Validaciones básicas
                    if (!id_inscripcion || calificacion === undefined || !id_tipo_evaluacion) {
                        throw new Error('Faltan campos requeridos');
                    }

                    if (calificacion < 0 || calificacion > 100) {
                        throw new Error('La calificación debe estar entre 0 y 100');
                    }

                    // Verificar inscripción y obtener datos de la materia
                    const inscripcion = await executeQuery(
                        'SELECT i.id_materia, i.gestion, i.paralelo FROM inscripciones i WHERE i.id_inscripcion = ?',
                        [id_inscripcion]
                    );

                    if (inscripcion.length === 0) {
                        throw new Error('Inscripción no encontrada');
                    }

                    // Determinar el docente para la nota
                    let nota_id_docente = id_docente;
                    if (isAdmin) {
                        const docenteMateria = await executeQuery(
                            'SELECT id_docente FROM docente_materias WHERE id_materia = ? AND gestion = ? AND paralelo = ?',
                            [inscripcion[0].id_materia, inscripcion[0].gestion, inscripcion[0].paralelo]
                        );

                        if (docenteMateria.length === 0) {
                            throw new Error('No se encontró un docente asignado a la materia');
                        }
                        nota_id_docente = docenteMateria[0].id_docente;
                    }

                    // Verificar si la nota ya existe
                    const notaExistente = await executeQuery(
                        'SELECT id_nota FROM notas WHERE id_inscripcion = ? AND id_tipo_evaluacion = ?',
                        [id_inscripcion, id_tipo_evaluacion]
                    );

                    // Insertar o actualizar la nota
                    if (notaExistente.length > 0) {
                        await executeQuery(
                            'UPDATE notas SET calificacion = ?, observaciones = ?, id_docente = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id_nota = ?',
                            [calificacion, observaciones, nota_id_docente, notaExistente[0].id_nota]
                        );
                    } else {
                        await executeQuery(
                            'INSERT INTO notas (id_inscripcion, calificacion, id_tipo_evaluacion, id_docente, observaciones) VALUES (?, ?, ?, ?, ?)',
                            [id_inscripcion, calificacion, id_tipo_evaluacion, nota_id_docente, observaciones]
                        );
                    }

                    // Agrupar para calcular nota final después
                    if (!notasPorInscripcion[id_inscripcion]) {
                        notasPorInscripcion[id_inscripcion] = {
                            id_materia: inscripcion[0].id_materia,
                            notas: []
                        };
                    }
                    notasPorInscripcion[id_inscripcion].notas.push({
                        id_tipo_evaluacion,
                        calificacion
                    });

                    resultados.exitosas++;
                } catch (error) {
                    resultados.fallidas++;
                    resultados.errores.push(error.message);
                }
            }

            // Auditar acción
            await auditAction(req, 'notas', 'INSERT', null, null, {
                tipo: 'registro_masivo',
                total: notas.length,
                exitosas: resultados.exitosas,
                fallidas: resultados.fallidas
            });

            res.json({
                success: true,
                message: 'Proceso de registro masivo completado',
                data: resultados
            });

        } catch (error) {
            next(error);
        }
    }


    async calcularPromedios(req, res, next) {
        try {
            const { id_inscripcion } = req.params;
            const query = `
                SELECT 
                    GROUP_CONCAT(
                        CONCAT(
                            te.nombre, ': ',
                            COALESCE(n.calificacion, 'No registrada')
                        )
                        ORDER BY te.orden
                        SEPARATOR '; '
                    ) as notas_detalle,
                    AVG(n.calificacion) as promedio_general
                FROM notas n
                INNER JOIN tipos_evaluacion te ON n.id_tipo_evaluacion = te.id_tipo_evaluacion
                WHERE n.id_inscripcion = ?
            `;
            const promedios = await executeQuery(query, [id_inscripcion]);
            res.json({ success: true, data: promedios[0] });
        } catch (error) {
            next(error);
        }
    }
    async obtenerNotasPorMateria(req, res, next) {
        try {
            const { id_materia } = req.params;

            const query = `
            SELECT 
                n.id_nota,
                n.calificacion,
                n.id_tipo_evaluacion,
                te.nombre as tipo_evaluacion_nombre,
                te.porcentaje as tipo_evaluacion_porcentaje,
                n.id_inscripcion,
                i.gestion,
                i.paralelo,
                i.estado as estado_inscripcion,
                e.id_estudiante,
                e.nombre as estudiante_nombre,
                e.apellido as estudiante_apellido,
                e.ci as estudiante_ci,
                m.id_materia,
                m.nombre as materia_nombre,
                m.sigla as materia_sigla
            FROM notas n
            INNER JOIN inscripciones i ON n.id_inscripcion = i.id_inscripcion
            INNER JOIN estudiantes e ON i.id_estudiante = e.id_estudiante
            INNER JOIN materias m ON i.id_materia = m.id_materia
            INNER JOIN tipos_evaluacion te ON n.id_tipo_evaluacion = te.id_tipo_evaluacion
            WHERE m.id_materia = ?
            ORDER BY e.apellido, e.nombre, te.orden
        `;

            const notas = await executeQuery(query, [id_materia]);

            res.json({
                success: true,
                data: notas
            });
        } catch (error) {
            next(error);
        }
    };
}

const controller = new NotaController();



module.exports = {
    listarNotas: controller.listarNotas.bind(controller),
    obtenerNota: controller.obtenerNota.bind(controller),
    crearNota: controller.registrarNota.bind(controller),
    registrarNota: controller.registrarNota.bind(controller),
    actualizarNota: controller.actualizarNota.bind(controller),
    eliminarNota: controller.eliminarNota.bind(controller),
    obtenerEstadisticas: controller.obtenerEstadisticas.bind(controller),
    obtenerNotasPorInscripcion: controller.obtenerNotasPorInscripcion.bind(controller),
    obtenerNotasPorMateria: controller.obtenerNotasPorMateria.bind(controller),
    registroMasivo: controller.registroMasivo.bind(controller),
    calcularPromedios: controller.calcularPromedios.bind(controller),
};
