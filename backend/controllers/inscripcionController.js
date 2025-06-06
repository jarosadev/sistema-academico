const { executeQuery } = require('../config/database');
const { createError } = require('../middleware/errorHandler');
const { auditAction } = require('../middleware/audit-complete');

/**
 * Controlador para gestión de inscripciones
 */
class InscripcionController {
    
    /**
     * Listar inscripciones con paginación y filtros
     */
    async listarInscripciones(req, res, next) {
        try {
            const {
                page = 1,
                limit = 10,
                estudiante = '',
                materia = '',
                gestion = '',
                estado = '',
                paralelo = '',
                periodo = '',
                sortBy = 'fecha_inscripcion',
                sortOrder = 'DESC'
            } = req.query;

            const offset = (parseInt(page) - 1) * parseInt(limit);
            const limitNum = Math.min(parseInt(limit), 100);

            // Construir condiciones WHERE
            let whereConditions = ['i.id_inscripcion IS NOT NULL'];
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

            if (gestion) {
                whereConditions.push('i.gestion = ?');
                queryParams.push(gestion);
            }

            if (estado) {
                whereConditions.push('i.estado = ?');
                queryParams.push(estado);
            }

            if (paralelo) {
                whereConditions.push('i.paralelo = ?');
                queryParams.push(paralelo);
            }

            if (periodo) {
                whereConditions.push('i.periodo = ?');
                queryParams.push(periodo);
            }

            const whereClause = whereConditions.join(' AND ');

            // Consulta principal con JOINs
            const query = `
                SELECT 
                    i.id_inscripcion,
                    i.gestion,
                    i.paralelo,
                    i.fecha_inscripcion,
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
                    d.nombre as docente_nombre,
                    d.apellido as docente_apellido
                FROM inscripciones i
                INNER JOIN estudiantes e ON i.id_estudiante = e.id_estudiante
                INNER JOIN materias m ON i.id_materia = m.id_materia
                LEFT JOIN menciones men ON m.id_mencion = men.id_mencion
                LEFT JOIN docente_materias dm ON m.id_materia = dm.id_materia 
                    AND i.gestion = dm.gestion AND i.paralelo = dm.paralelo
                LEFT JOIN docentes d ON dm.id_docente = d.id_docente
                WHERE ${whereClause}
                ORDER BY i.${sortBy} ${sortOrder}
                LIMIT ${limitNum} OFFSET ${offset}
            `;

            // Consulta para contar total
            const countQuery = `
                SELECT COUNT(DISTINCT i.id_inscripcion) as total
                FROM inscripciones i
                INNER JOIN estudiantes e ON i.id_estudiante = e.id_estudiante
                INNER JOIN materias m ON i.id_materia = m.id_materia
                LEFT JOIN menciones men ON m.id_mencion = men.id_mencion
                WHERE ${whereClause}
            `;

            const [inscripciones, countResult] = await Promise.all([
                executeQuery(query, queryParams),
                executeQuery(countQuery, queryParams)
            ]);

            const total = countResult[0].total;
            const totalPages = Math.ceil(total / limitNum);

            res.json({
                success: true,
                data: inscripciones,
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
     * Obtener inscripción por ID
     */
    async obtenerDetalleInscripcion(req, res, next) {
        try {
            const { id } = req.params;

            // Obtener datos básicos de la inscripción
            const inscripcionQuery = `
                SELECT 
                    i.*,
                    e.nombre as estudiante_nombre,
                    e.apellido as estudiante_apellido,
                    e.ci as estudiante_ci,
                    e.estado_academico,
                    m.nombre as materia_nombre,
                    m.sigla as materia_sigla,
                    m.semestre,
                    m.descripcion as materia_descripcion,
                    men.nombre as mencion_nombre,
                    d.nombre as docente_nombre,
                    d.apellido as docente_apellido,
                    d.especialidad as docente_especialidad
                FROM inscripciones i
                INNER JOIN estudiantes e ON i.id_estudiante = e.id_estudiante
                INNER JOIN materias m ON i.id_materia = m.id_materia
                LEFT JOIN menciones men ON m.id_mencion = men.id_mencion
                LEFT JOIN docente_materias dm ON m.id_materia = dm.id_materia 
                    AND i.gestion = dm.gestion AND i.periodo = dm.periodo AND i.paralelo = dm.paralelo
                LEFT JOIN docentes d ON dm.id_docente = d.id_docente
                WHERE i.id_inscripcion = ?
            `;

            const inscripciones = await executeQuery(inscripcionQuery, [id]);

            if (inscripciones.length === 0) {
                throw createError('Inscripción no encontrada', 404);
            }

            // Obtener notas y tipos de evaluación
            const notasQuery = `
                SELECT 
                    n.*,
                    te.nombre as tipo_evaluacion
                FROM notas n
                LEFT JOIN tipos_evaluacion te ON n.id_tipo_evaluacion = te.id_tipo_evaluacion
                WHERE n.id_inscripcion = ?
                ORDER BY te.orden ASC
            `;

            const notas = await executeQuery(notasQuery, [id]);

            res.json({
                success: true,
                data: {
                    ...inscripciones[0],
                    notas: notas
                }
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Crear nueva inscripción
     */
    async crearInscripcion(req, res, next) {
        try {
            const {
                id_estudiante,
                id_materia,
                gestion,
                periodo = 1,
                paralelo = 'A'
            } = req.body;

            // Verificar que el estudiante existe y está activo
            const estudianteExistente = await executeQuery(
                'SELECT * FROM estudiantes WHERE id_estudiante = ? AND estado_academico = "activo"',
                [id_estudiante]
            );

            if (estudianteExistente.length === 0) {
                throw createError('Estudiante no encontrado o inactivo', 404);
            }

            // Verificar que la materia existe y está activa
            const materiaExistente = await executeQuery(
                'SELECT * FROM materias WHERE id_materia = ? AND activo = TRUE',
                [id_materia]
            );

            if (materiaExistente.length === 0) {
                throw createError('Materia no encontrada o inactiva', 404);
            }

            // Verificar que no esté ya inscrito en la misma materia y gestión
            const inscripcionExistente = await executeQuery(
                'SELECT id_inscripcion FROM inscripciones WHERE id_estudiante = ? AND id_materia = ? AND gestion = ? AND periodo = ?',
                [id_estudiante, id_materia, gestion, periodo]
            );

            if (inscripcionExistente.length > 0) {
                throw createError('Ya tienes registrada una inscripción para esta materia en la gestión actual', 409);
            }

            // Verificar que la materia pertenece a la mención del estudiante
            const mencionEstudiante = estudianteExistente[0].id_mencion;
            const mencionMateria = materiaExistente[0].id_mencion;

            if (mencionEstudiante !== mencionMateria) {
                throw createError('La materia no pertenece a la mención del estudiante', 400);
            }

            // Verificar que existe la asignación docente-materia para el paralelo
            const asignacionDocente = await executeQuery(
                'SELECT * FROM docente_materias WHERE id_materia = ? AND gestion = ? AND periodo = ? AND paralelo = ?',
                [id_materia, gestion, periodo, paralelo]
            );

            if (asignacionDocente.length === 0) {
                throw createError('No hay docente asignado para esta materia en el paralelo seleccionado', 404);
            }

            // Verificar prerrequisitos (solo si no es administrador)
            const esAdmin = req.user && req.user.roles && req.user.roles.includes('administrador');
            
            if (!esAdmin) {
                // Verificar prerrequisitos
                const prerequisitosQuery = `
                    SELECT 
                        mp.id_materia_prerequisito,
                        m.nombre,
                        CASE 
                            WHEN i.estado = 'aprobado' THEN TRUE
                            ELSE FALSE
                        END as cumplido
                    FROM materias_prerequisitos mp
                    INNER JOIN materias m ON mp.id_materia_prerequisito = m.id_materia
                    LEFT JOIN inscripciones i ON m.id_materia = i.id_materia 
                        AND i.id_estudiante = ?
                        AND i.estado = 'aprobado'
                    WHERE mp.id_materia = ? AND mp.obligatorio = TRUE
                `;

                const prerequisitos = await executeQuery(prerequisitosQuery, [id_estudiante, id_materia]);
                
                const prerequisitosNoCumplidos = prerequisitos.filter(p => !p.cumplido);
                
                if (prerequisitosNoCumplidos.length > 0) {
                    const materiasFaltantes = prerequisitosNoCumplidos.map(p => p.nombre).join(', ');
                    throw createError(
                        `No cumple con los prerrequisitos. Debe aprobar primero: ${materiasFaltantes}`,
                        400
                    );
                }
            }

            // Verificar conflictos de horario
            const conflictosQuery = `
                SELECT 
                    h1.dia_semana,
                    h1.hora_inicio,
                    h1.hora_fin,
                    m.nombre as materia_nombre
                FROM horarios h1
                INNER JOIN inscripciones i ON h1.id_materia = i.id_materia 
                    AND h1.gestion = i.gestion 
                    AND h1.periodo = i.periodo
                    AND h1.paralelo = i.paralelo
                INNER JOIN materias m ON i.id_materia = m.id_materia
                WHERE i.id_estudiante = ?
                    AND i.gestion = ?
                    AND i.periodo = ?
                    AND i.estado = 'inscrito'
                    AND h1.activo = TRUE
                    AND EXISTS (
                        SELECT 1 FROM horarios h2
                        WHERE h2.id_materia = ?
                            AND h2.gestion = ?
                            AND h2.periodo = ?
                            AND h2.paralelo = ?
                            AND h2.dia_semana = h1.dia_semana
                            AND h2.activo = TRUE
                            AND (
                                (h2.hora_inicio < h1.hora_fin AND h2.hora_fin > h1.hora_inicio)
                            )
                    )
            `;

            const conflictos = await executeQuery(conflictosQuery, [
                id_estudiante, gestion, periodo,
                id_materia, gestion, periodo, paralelo
            ]);

            if (conflictos.length > 0) {
                const conflicto = conflictos[0];
                throw createError(
                    `Conflicto de horario con ${conflicto.materia_nombre} el día ${conflicto.dia_semana}`,
                    409
                );
            }

            // Verificar que hay cupo en el paralelo (opcional - se puede configurar límite)
            const cupoQuery = `
                SELECT COUNT(*) as inscritos
                FROM inscripciones 
                WHERE id_materia = ? AND gestion = ? AND periodo = ? AND paralelo = ?
            `;

            const cupoResult = await executeQuery(cupoQuery, [id_materia, gestion, periodo, paralelo]);
            const LIMITE_PARALELO = 60; // Configurable

            if (cupoResult[0].inscritos >= LIMITE_PARALELO) {
                throw createError(`El paralelo ${paralelo} está lleno (límite: ${LIMITE_PARALELO} estudiantes)`, 400);
            }

            // Crear inscripción
            const query = `
                INSERT INTO inscripciones (
                    id_estudiante, id_materia, gestion, periodo, paralelo, estado
                ) VALUES (?, ?, ?, ?, ?, 'inscrito')
            `;

            const result = await executeQuery(query, [
                id_estudiante, id_materia, gestion, periodo, paralelo
            ]);

            // Auditar acción
            await auditAction(req, 'inscripciones', 'INSERT', result.insertId, null, {
                id_estudiante, id_materia, gestion, periodo, paralelo
            });

            res.status(201).json({
                success: true,
                message: 'Inscripción creada exitosamente',
                data: {
                    id_inscripcion: result.insertId,
                    id_estudiante: parseInt(id_estudiante),
                    id_materia: parseInt(id_materia),
                    gestion: parseInt(gestion),
                    periodo: parseInt(periodo),
                    paralelo,
                    estado: 'inscrito'
                }
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Actualizar estado de inscripción
     */
    async actualizarInscripcion(req, res, next) {
        try {
            const { id } = req.params;
            const { estado, paralelo, periodo, gestion } = req.body;

            // Verificar que la inscripción existe
            const inscripcionExistente = await executeQuery(
                'SELECT * FROM inscripciones WHERE id_inscripcion = ?',
                [id]
            );

            if (inscripcionExistente.length === 0) {
                throw createError('Inscripción no encontrada', 404);
            }

            const datosAnteriores = inscripcionExistente[0];

            // Validar cambio de estado
            const estadosValidos = ['inscrito', 'aprobado', 'reprobado', 'abandonado'];
            if (estado && !estadosValidos.includes(estado)) {
                throw createError('Estado de inscripción inválido', 400);
            }

            // Si se cambia a aprobado, verificar que tenga nota final
            if (estado === 'aprobado') {
                const notaFinal = await executeQuery(
                    'SELECT calificacion FROM notas WHERE id_inscripcion = ? AND tipo_evaluacion = "final"',
                    [id]
                );

                if (notaFinal.length === 0 || notaFinal[0].calificacion < 51) {
                    throw createError('No se puede aprobar sin nota final válida (≥51)', 400);
                }
            }

            // Validar que el paralelo y periodo no estén vacíos si se proporcionan
            if (paralelo !== undefined && paralelo === '') {
                throw createError('El paralelo no puede estar vacío', 400);
            }
            if (periodo !== undefined && (typeof periodo !== 'number' || periodo < 1)) {
                throw createError('El periodo debe ser un número válido mayor o igual a 1', 400);
            }
            if (gestion !== undefined && (typeof gestion !== 'number' || gestion < 2000)) {
                throw createError('La gestión debe ser un número válido', 400);
            }

            // Actualizar inscripción
            let updateFields = [];
            let updateParams = [];

            if (estado) {
                updateFields.push('estado = ?');
                updateParams.push(estado);
            }

            if (paralelo) {
                updateFields.push('paralelo = ?');
                updateParams.push(paralelo);
            }

            if (periodo) {
                updateFields.push('periodo = ?');
                updateParams.push(periodo);
            }

            if (gestion) {
                updateFields.push('gestion = ?');
                updateParams.push(gestion);
            }

            if (updateFields.length === 0) {
                throw createError('No hay campos para actualizar', 400);
            }

            updateFields.push('fecha_actualizacion = CURRENT_TIMESTAMP');
            updateParams.push(id);

            const query = `
                UPDATE inscripciones SET ${updateFields.join(', ')}
                WHERE id_inscripcion = ?
            `;

            await executeQuery(query, updateParams);

            // Auditar acción
            await auditAction(req, 'inscripciones', 'UPDATE', id, datosAnteriores, {
                estado, paralelo, periodo, gestion
            });

            res.json({
                success: true,
                message: 'Inscripción actualizada exitosamente',
                data: {
                    id_inscripcion: parseInt(id),
                    estado: estado || datosAnteriores.estado,
                    paralelo: paralelo || datosAnteriores.paralelo,
                    periodo: periodo || datosAnteriores.periodo,
                    gestion: gestion || datosAnteriores.gestion
                }
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Eliminar inscripción
     */
    async eliminarInscripcion(req, res, next) {
        try {
            const { id } = req.params;

            // Verificar que la inscripción existe
            const inscripcionExistente = await executeQuery(
                'SELECT * FROM inscripciones WHERE id_inscripcion = ?',
                [id]
            );

            if (inscripcionExistente.length === 0) {
                throw createError('Inscripción no encontrada', 404);
            }

            // Verificar que no tenga notas registradas
            const notasExistentes = await executeQuery(
                'SELECT COUNT(*) as total FROM notas WHERE id_inscripcion = ?',
                [id]
            );

            if (notasExistentes[0].total > 0) {
                throw createError('No se puede eliminar una inscripción con notas registradas', 400);
            }

            // Eliminar inscripción
            const query = 'DELETE FROM inscripciones WHERE id_inscripcion = ?';
            await executeQuery(query, [id]);

            // Auditar acción
            await auditAction(req, 'inscripciones', 'DELETE', id, inscripcionExistente[0], null);

            res.json({
                success: true,
                message: 'Inscripción eliminada exitosamente'
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtener inscripciones de un estudiante
     */
    async obtenerInscripcionesPorEstudiante(req, res, next) {
        try {
            const { id_estudiante } = req.params;
            const { gestion = '', estado = '' } = req.query;

            let whereConditions = ['i.id_estudiante = ?'];
            let queryParams = [id_estudiante];

            if (gestion) {
                whereConditions.push('i.gestion = ?');
                queryParams.push(gestion);
            }

            if (estado) {
                whereConditions.push('i.estado = ?');
                queryParams.push(estado);
            }

            const whereClause = whereConditions.join(' AND ');

            const query = `
                SELECT 
                    i.*,
                    m.nombre as materia_nombre,
                    m.sigla as materia_sigla,
                    m.semestre,
                    men.nombre as mencion_nombre,
                    AVG(CASE WHEN te.nombre = 'final' THEN n.calificacion END) as nota_final
                FROM inscripciones i
                INNER JOIN materias m ON i.id_materia = m.id_materia
                LEFT JOIN menciones men ON m.id_mencion = men.id_mencion
                LEFT JOIN notas n ON i.id_inscripcion = n.id_inscripcion
                LEFT JOIN tipos_evaluacion te ON n.id_tipo_evaluacion = te.id_tipo_evaluacion
                WHERE ${whereClause}
                GROUP BY i.id_inscripcion
                ORDER BY i.gestion DESC, m.semestre ASC
            `;

            const inscripciones = await executeQuery(query, queryParams);

            res.json({
                success: true,
                data: inscripciones
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtener estadísticas de inscripciones
     */
    async obtenerEstadisticas(req, res, next) {
        try {
            const { gestion = new Date().getFullYear() } = req.query;

            const estadisticasQuery = `
                SELECT 
                    COUNT(*) as total_inscripciones,
                    COUNT(CASE WHEN estado = 'inscrito' THEN 1 END) as inscritos,
                    COUNT(CASE WHEN estado = 'aprobado' THEN 1 END) as aprobados,
                    COUNT(CASE WHEN estado = 'reprobado' THEN 1 END) as reprobados,
                    COUNT(CASE WHEN estado = 'abandonado' THEN 1 END) as abandonados
                FROM inscripciones
                WHERE gestion = ?
            `;

            const porMateriaQuery = `
                SELECT 
                    m.nombre as materia,
                    m.sigla,
                    COUNT(i.id_inscripcion) as total_inscritos,
                    COUNT(CASE WHEN i.estado = 'aprobado' THEN 1 END) as aprobados,
                    ROUND(COUNT(CASE WHEN i.estado = 'aprobado' THEN 1 END) * 100.0 / COUNT(i.id_inscripcion), 2) as porcentaje_aprobacion
                FROM materias m
                LEFT JOIN inscripciones i ON m.id_materia = i.id_materia AND i.gestion = ?
                WHERE m.activo = TRUE
                GROUP BY m.id_materia
                HAVING total_inscritos > 0
                ORDER BY total_inscritos DESC
                LIMIT 10
            `;

            const porParaleloQuery = `
                SELECT 
                    paralelo,
                    COUNT(*) as total_inscritos
                FROM inscripciones
                WHERE gestion = ?
                GROUP BY paralelo
                ORDER BY paralelo ASC
            `;

            const [estadisticas, porMateria, porParalelo] = await Promise.all([
                executeQuery(estadisticasQuery, [gestion]),
                executeQuery(porMateriaQuery, [gestion]),
                executeQuery(porParaleloQuery, [gestion])
            ]);

            res.json({
                success: true,
                data: {
                    gestion: parseInt(gestion),
                    resumen: estadisticas[0],
                    por_materia: porMateria,
                    por_paralelo: porParalelo
                }
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtener inscripciones por materia
     */
    async obtenerInscripcionesPorMateria(req, res, next) {
        try {
            const { id_materia } = req.params;
            const { gestion = '', estado = '' } = req.query;

            let whereConditions = ['i.id_materia = ?'];
            let queryParams = [id_materia];

            if (gestion) {
                whereConditions.push('i.gestion = ?');
                queryParams.push(gestion);
            }

            if (estado) {
                whereConditions.push('i.estado = ?');
                queryParams.push(estado);
            }

            const whereClause = whereConditions.join(' AND ');

            const query = `
                SELECT 
                    i.*,
                    e.nombre as estudiante_nombre,
                    e.apellido as estudiante_apellido,
                    e.ci as estudiante_ci,
                    m.nombre as materia_nombre,
                    m.sigla as materia_sigla,
                    m.semestre,
                    men.nombre as mencion_nombre
                FROM inscripciones i
                INNER JOIN estudiantes e ON i.id_estudiante = e.id_estudiante
                INNER JOIN materias m ON i.id_materia = m.id_materia
                LEFT JOIN menciones men ON m.id_mencion = men.id_mencion
                WHERE ${whereClause}
                ORDER BY e.apellido ASC, e.nombre ASC
            `;

            const inscripciones = await executeQuery(query, queryParams);

            res.json({
                success: true,
                data: inscripciones
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Inscripción masiva (para administradores)
     */
    async inscripcionMasiva(req, res, next) {
        try {
            const { inscripciones } = req.body; // Array de objetos con id_estudiante, id_materia, gestion, paralelo

            if (!Array.isArray(inscripciones) || inscripciones.length === 0) {
                throw createError('Se requiere un array de inscripciones', 400);
            }

            const resultados = {
                exitosas: 0,
                fallidas: 0,
                errores: []
            };

            // Procesar cada inscripción
            for (let i = 0; i < inscripciones.length; i++) {
                try {
                    const { id_estudiante, id_materia, gestion, paralelo = 'A' } = inscripciones[i];

                    // Validaciones básicas
                    if (!id_estudiante || !id_materia || !gestion) {
                        throw new Error(`Inscripción ${i + 1}: Faltan campos requeridos`);
                    }

                    // Verificar duplicados
                    const existente = await executeQuery(
                        'SELECT id_inscripcion FROM inscripciones WHERE id_estudiante = ? AND id_materia = ? AND gestion = ?',
                        [id_estudiante, id_materia, gestion]
                    );

                    if (existente.length > 0) {
                        throw new Error(`Inscripción ${i + 1}: Ya existe`);
                    }

                    // Crear inscripción
                    await executeQuery(
                        'INSERT INTO inscripciones (id_estudiante, id_materia, gestion, paralelo, estado) VALUES (?, ?, ?, ?, "inscrito")',
                        [id_estudiante, id_materia, gestion, paralelo]
                    );

                    resultados.exitosas++;

                } catch (error) {
                    resultados.fallidas++;
                    resultados.errores.push(error.message);
                }
            }

            // Auditar acción masiva
            await auditAction(req, 'inscripciones', 'INSERT', null, null, {
                tipo: 'inscripcion_masiva',
                total: inscripciones.length,
                exitosas: resultados.exitosas,
                fallidas: resultados.fallidas
            });

            res.json({
                success: true,
                message: 'Proceso de inscripción masiva completado',
                data: resultados
            });

        } catch (error) {
            next(error);
        }
    }

    async cambiarEstado (req, res, next) {
        try {
            const { id } = req.params;
            const { estado, paralelo, periodo, gestion } = req.body;

            // Verificar que la inscripción existe
            const inscripcionExistente = await executeQuery(
                'SELECT * FROM inscripciones WHERE id_inscripcion = ?',
                [id]
            );

            if (inscripcionExistente.length === 0) {
                throw createError('Inscripción no encontrada', 404);
            }

            // Validar estado
            const estadosValidos = ['inscrito', 'aprobado', 'reprobado', 'abandonado'];
            if (estado && !estadosValidos.includes(estado)) {
                throw createError('Estado de inscripción inválido', 400);
            }

            // Validar que el paralelo y periodo no estén vacíos si se proporcionan
            if (paralelo !== undefined && paralelo === '') {
                throw createError('El paralelo no puede estar vacío', 400);
            }
            if (periodo !== undefined && (typeof periodo !== 'number' || periodo < 1)) {
                throw createError('El periodo debe ser un número válido mayor o igual a 1', 400);
            }
            if (gestion !== undefined && (typeof gestion !== 'number' || gestion < 2000)) {
                throw createError('La gestión debe ser un número válido', 400);
            }

            // Actualizar inscripción
            let updateFields = [];
            let updateParams = [];

            if (estado) {
                updateFields.push('estado = ?');
                updateParams.push(estado);
            }

            if (paralelo) {
                updateFields.push('paralelo = ?');
                updateParams.push(paralelo);
            }

            if (periodo) {
                updateFields.push('periodo = ?');
                updateParams.push(periodo);
            }

            if (gestion) {
                updateFields.push('gestion = ?');
                updateParams.push(gestion);
            }

            if (updateFields.length === 0) {
                throw createError('No hay campos para actualizar', 400);
            }

            updateFields.push('fecha_actualizacion = CURRENT_TIMESTAMP');
            updateParams.push(id);

            const query = `
                UPDATE inscripciones SET ${updateFields.join(', ')}
                WHERE id_inscripcion = ?
            `;

            await executeQuery(query, updateParams);

            // Auditar acción
            await auditAction(req, 'inscripciones', 'UPDATE', id, inscripcionExistente[0], {
                estado, paralelo, periodo, gestion
            });

            res.json({
                success: true,
                message: 'Estado de inscripción actualizado exitosamente',
                data: {
                    id_inscripcion: parseInt(id),
                    estado: estado || inscripcionExistente[0].estado,
                    paralelo: paralelo || inscripcionExistente[0].paralelo,
                    periodo: periodo || inscripcionExistente[0].periodo,
                    gestion: gestion || inscripcionExistente[0].gestion
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

const controller = new InscripcionController();

module.exports = {
    listarInscripciones: controller.listarInscripciones.bind(controller),
    obtenerDetalleInscripcion: controller.obtenerDetalleInscripcion.bind(controller),
    crearInscripcion: controller.crearInscripcion.bind(controller),
    actualizarInscripcion: controller.actualizarInscripcion.bind(controller),
    eliminarInscripcion: controller.eliminarInscripcion.bind(controller),
    obtenerEstadisticas: controller.obtenerEstadisticas.bind(controller),
    obtenerInscripcionesPorMateria: controller.obtenerInscripcionesPorMateria.bind(controller),
    cambiarEstado: controller.cambiarEstado.bind(controller),
    obtenerInscripcionesPorEstudiante: controller.obtenerInscripcionesPorEstudiante.bind(controller),
};
