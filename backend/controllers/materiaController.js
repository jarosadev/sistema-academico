const { executeQuery, getConnection } = require('../config/database');
const { createError } = require('../middleware/errorHandler');
const { auditAction } = require('../middleware/audit-complete');

/**
 * Controlador para gestión de materias
 */
class MateriaController {
    
    /**
     * Listar materias con paginación y filtros
     */
    async listarMaterias(req, res, next) {
        try {
            const {
                page = 1,
                limit = 10,
                search = '',
                mencion = '',
                semestre = '',
                activo = '',
                sortBy = 'nombre',
                sortOrder = 'ASC'
            } = req.query;

            const offset = (parseInt(page) - 1) * parseInt(limit);
            const limitNum = Math.min(parseInt(limit), 100);

            // Construir condiciones WHERE
            let whereConditions = ['m.id_materia IS NOT NULL'];
            let queryParams = [];

            if (search) {
                whereConditions.push('(m.nombre LIKE ? OR m.sigla LIKE ?)');
                const searchTerm = `%${search}%`;
                queryParams.push(searchTerm, searchTerm);
            }

            if (mencion) {
                whereConditions.push('m.id_mencion = ?');
                queryParams.push(mencion);
            }

            if (semestre) {
                whereConditions.push('m.semestre = ?');
                queryParams.push(semestre);
            }

            if (activo !== '') {
                whereConditions.push('m.activo = ?');
                queryParams.push(activo === 'true');
            }

            const whereClause = whereConditions.join(' AND ');

            // Consulta principal con JOIN
            const query = `
                SELECT 
                    m.id_materia,
                    m.nombre,
                    m.sigla,
                    m.semestre,
                    m.descripcion,
                    m.activo,
                    m.fecha_creacion,
                    men.nombre as mencion_nombre,
                    men.id_mencion,
                    COUNT(DISTINCT i.id_estudiante) as estudiantes_inscritos,
                    COUNT(DISTINCT dm.id_docente) as docentes_asignados
                FROM materias m
                LEFT JOIN menciones men ON m.id_mencion = men.id_mencion
                LEFT JOIN inscripciones i ON m.id_materia = i.id_materia AND i.gestion = YEAR(CURDATE())
                LEFT JOIN docente_materias dm ON m.id_materia = dm.id_materia AND dm.gestion = YEAR(CURDATE())
                WHERE ${whereClause}
                GROUP BY m.id_materia
                ORDER BY m.${sortBy} ${sortOrder}
                LIMIT ${limitNum} OFFSET ${offset}
            `;

            // Consulta para contar total
            const countQuery = `
                SELECT COUNT(DISTINCT m.id_materia) as total
                FROM materias m
                LEFT JOIN menciones men ON m.id_mencion = men.id_mencion
                WHERE ${whereClause}
            `;

            const [materias, countResult] = await Promise.all([
                executeQuery(query, queryParams),
                executeQuery(countQuery, queryParams)
            ]);

            const total = countResult[0].total;
            const totalPages = Math.ceil(total / limitNum);

            res.json({
                success: true,
                data: materias,
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
     * Obtener materia por ID
     */
    async obtenerMateria(req, res, next) {
        try {
            const { id } = req.params;

            const query = `
                SELECT 
                    m.*,
                    men.nombre as mencion_nombre
                FROM materias m
                LEFT JOIN menciones men ON m.id_mencion = men.id_mencion
                WHERE m.id_materia = ?
            `;

            const materias = await executeQuery(query, [id]);

            if (materias.length === 0) {
                throw createError('Materia no encontrada', 404);
            }

            // Obtener docentes asignados
            const docentesQuery = `
                SELECT 
                    d.id_docente,
                    d.nombre,
                    d.apellido,
                    d.especialidad,
                    dm.gestion,
                    dm.paralelo,
                    dm.fecha_asignacion
                FROM docente_materias dm
                INNER JOIN docentes d ON dm.id_docente = d.id_docente
                WHERE dm.id_materia = ?
                ORDER BY dm.gestion DESC, dm.paralelo ASC
            `;

            // Obtener estadísticas de inscripciones
            const estadisticasQuery = `
                WITH RECURSIVE years AS (
                    SELECT YEAR(CURDATE()) as year
                    UNION ALL
                    SELECT year - 1 FROM years WHERE year > YEAR(CURDATE()) - 5
                )
                SELECT 
                    y.year as gestion,
                    COALESCE(COUNT(i.id_inscripcion), 0) as total_inscritos,
                    COALESCE(COUNT(CASE WHEN i.estado = 'aprobado' THEN 1 END), 0) as aprobados,
                    COALESCE(COUNT(CASE WHEN i.estado = 'reprobado' THEN 1 END), 0) as reprobados,
                    COALESCE(COUNT(CASE WHEN i.estado = 'abandonado' THEN 1 END), 0) as abandonados,
                    COALESCE(AVG(CASE WHEN te.nombre = 'Examen Final' THEN n.calificacion END), 0) as promedio_final
                FROM years y
                LEFT JOIN inscripciones i ON i.id_materia = ? AND i.gestion = y.year
                LEFT JOIN notas n ON i.id_inscripcion = n.id_inscripcion
                LEFT JOIN tipos_evaluacion te ON n.id_tipo_evaluacion = te.id_tipo_evaluacion
                GROUP BY y.year
                ORDER BY y.year DESC
            `;

            const [docentes, estadisticas] = await Promise.all([
                executeQuery(docentesQuery, [id]),
                executeQuery(estadisticasQuery, [id])
            ]);

            res.json({
                success: true,
                data: {
                    ...materias[0],
                    docentes_asignados: docentes,
                    estadisticas_historicas: estadisticas
                }
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Crear nueva materia
     */
    async crearMateria(req, res, next) {
        try {
            const {
                nombre,
                sigla,
                semestre,
                id_mencion,
                descripcion
            } = req.body;

            // Verificar que la sigla no exista en la misma mención
            const siglaExistente = await executeQuery(
                'SELECT id_materia FROM materias WHERE sigla = ? AND id_mencion = ?',
                [sigla, id_mencion]
            );

            if (siglaExistente.length > 0) {
                throw createError('Ya existe una materia con esa sigla en esta mención', 409);
            }

            // Verificar que la mención existe
            const mencionExistente = await executeQuery(
                'SELECT id_mencion FROM menciones WHERE id_mencion = ? AND activo = TRUE',
                [id_mencion]
            );

            if (mencionExistente.length === 0) {
                throw createError('Mención no encontrada o inactiva', 404);
            }

            // Crear materia
            const query = `
                INSERT INTO materias (
                    nombre, sigla, semestre, id_mencion, descripcion, activo
                ) VALUES (?, ?, ?, ?, ?, TRUE)
            `;

            const result = await executeQuery(query, [
                nombre, sigla, semestre, id_mencion, descripcion
            ]);

            // Auditar acción
            await auditAction(req, 'materias', 'INSERT', result.insertId, null, {
                nombre, sigla, semestre, id_mencion, descripcion
            });

            res.status(201).json({
                success: true,
                message: 'Materia creada exitosamente',
                data: {
                    id_materia: result.insertId,
                    nombre,
                    sigla,
                    semestre,
                    id_mencion
                }
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Actualizar materia
     */
    async actualizarMateria(req, res, next) {
        try {
            const { id } = req.params;
            const {
                nombre,
                sigla,
                semestre,
                id_mencion,
                descripcion,
                activo
            } = req.body;

            // Verificar que la materia existe
            const materiaExistente = await executeQuery(
                'SELECT * FROM materias WHERE id_materia = ?',
                [id]
            );

            if (materiaExistente.length === 0) {
                throw createError('Materia no encontrada', 404);
            }

            const datosAnteriores = materiaExistente[0];

            // Verificar que la sigla no exista en otra materia de la misma mención
            if (sigla !== datosAnteriores.sigla || id_mencion !== datosAnteriores.id_mencion) {
                const siglaExistente = await executeQuery(
                    'SELECT id_materia FROM materias WHERE sigla = ? AND id_mencion = ? AND id_materia != ?',
                    [sigla, id_mencion, id]
                );

                if (siglaExistente.length > 0) {
                    throw createError('Ya existe una materia con esa sigla en esta mención', 409);
                }
            }

            // Actualizar materia
            const query = `
                UPDATE materias SET
                    nombre = ?,
                    sigla = ?,
                    semestre = ?,
                    id_mencion = ?,
                    descripcion = ?,
                    activo = ?,
                    fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id_materia = ?
            `;

            await executeQuery(query, [
                nombre, sigla, semestre, id_mencion, descripcion, activo, id
            ]);

            // Auditar acción
            await auditAction(req, 'materias', 'UPDATE', id, datosAnteriores, {
                nombre, sigla, semestre, id_mencion, descripcion, activo
            });

            res.json({
                success: true,
                message: 'Materia actualizada exitosamente',
                data: {
                    id_materia: parseInt(id),
                    nombre,
                    sigla,
                    semestre,
                    activo
                }
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Eliminar materia (soft delete)
     */
    async eliminarMateria(req, res, next) {
        try {
            const { id } = req.params;

            // Verificar que la materia existe
            const materiaExistente = await executeQuery(
                'SELECT * FROM materias WHERE id_materia = ?',
                [id]
            );

            if (materiaExistente.length === 0) {
                throw createError('Materia no encontrada', 404);
            }

            // Verificar que no tenga inscripciones activas
            const inscripcionesActivas = await executeQuery(
                'SELECT COUNT(*) as total FROM inscripciones WHERE id_materia = ? AND gestion = YEAR(CURDATE())',
                [id]
            );

            if (inscripcionesActivas[0].total > 0) {
                throw createError('No se puede eliminar una materia con inscripciones en la gestión actual', 400);
            }

            // Cambiar estado a inactivo
            const query = `
                UPDATE materias SET
                    activo = FALSE,
                    fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id_materia = ?
            `;

            await executeQuery(query, [id]);

            // Auditar acción
            await auditAction(req, 'materias', 'UPDATE', id, materiaExistente[0], {
                activo: false
            });

            res.json({
                success: true,
                message: 'Materia desactivada exitosamente'
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtener materias por mención
     */
    async obtenerMateriasPorMencion(req, res, next) {
        try {
            const { id_mencion } = req.params;
            const { semestre = '', activo = 'true' } = req.query;

            let whereConditions = ['m.id_mencion = ?'];
            let queryParams = [id_mencion];

            if (semestre) {
                whereConditions.push('m.semestre = ?');
                queryParams.push(semestre);
            }

            if (activo !== '') {
                whereConditions.push('m.activo = ?');
                queryParams.push(activo === 'true');
            }

            const whereClause = whereConditions.join(' AND ');

            const query = `
                SELECT 
                    m.*,
                    COUNT(DISTINCT i.id_estudiante) as estudiantes_inscritos_actual
                FROM materias m
                LEFT JOIN inscripciones i ON m.id_materia = i.id_materia AND i.gestion = YEAR(CURDATE())
                WHERE ${whereClause}
                GROUP BY m.id_materia
                ORDER BY m.semestre ASC, m.nombre ASC
            `;

            const materias = await executeQuery(query, queryParams);

            res.json({
                success: true,
                data: materias
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtener estadísticas de materias
     */
    async obtenerEstadisticas(req, res, next) {
        try {
            const estadisticasQuery = `
                SELECT 
                    COUNT(*) as total_materias,
                    COUNT(CASE WHEN activo = TRUE THEN 1 END) as activas,
                    COUNT(CASE WHEN activo = FALSE THEN 1 END) as inactivas
                FROM materias
            `;

            const porMencionQuery = `
                SELECT 
                    men.nombre as mencion,
                    COUNT(m.id_materia) as cantidad_materias
                FROM menciones men
                LEFT JOIN materias m ON men.id_mencion = m.id_mencion AND m.activo = TRUE
                WHERE men.activo = TRUE
                GROUP BY men.id_mencion, men.nombre
                ORDER BY cantidad_materias DESC
            `;

            const porSemestreQuery = `
                SELECT 
                    semestre,
                    COUNT(*) as cantidad_materias
                FROM materias
                WHERE activo = TRUE
                GROUP BY semestre
                ORDER BY semestre ASC
            `;

            const masPopularesQuery = `
                SELECT 
                    m.nombre,
                    m.sigla,
                    men.nombre as mencion,
                    COUNT(i.id_inscripcion) as total_inscripciones
                FROM materias m
                LEFT JOIN menciones men ON m.id_mencion = men.id_mencion
                LEFT JOIN inscripciones i ON m.id_materia = i.id_materia
                WHERE m.activo = TRUE
                GROUP BY m.id_materia
                ORDER BY total_inscripciones DESC
                LIMIT 10
            `;

            const [estadisticas, porMencion, porSemestre, masPopulares] = await Promise.all([
                executeQuery(estadisticasQuery),
                executeQuery(porMencionQuery),
                executeQuery(porSemestreQuery),
                executeQuery(masPopularesQuery)
            ]);

            res.json({
                success: true,
                data: {
                    resumen: estadisticas[0],
                    por_mencion: porMencion,
                    por_semestre: porSemestre,
                    mas_populares: masPopulares
                }
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtener prerequisitos de una materia
     */
    async obtenerPrerequisitos(req, res, next) {
        try {
            const { id } = req.params;

            // Por ahora retornamos estructura vacía, se puede implementar tabla de prerequisitos
            res.json({
                success: true,
                data: {
                    id_materia: parseInt(id),
                    prerequisitos: [],
                    mensaje: 'Funcionalidad de prerequisitos disponible para implementación futura'
                }
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtener docentes asignados a una materia
     */
    async obtenerDocentesMateria(req, res, next) {
        try {
            const { id } = req.params;
            const query = `
                SELECT 
                    d.id_docente,
                    d.nombre,
                    d.apellido,
                    d.especialidad,
                    dm.gestion,
                    dm.paralelo,
                    dm.fecha_asignacion
                FROM docente_materias dm
                INNER JOIN docentes d ON dm.id_docente = d.id_docente
                WHERE dm.id_materia = ?
                ORDER BY dm.gestion DESC, dm.paralelo ASC
            `;
            const docentes = await executeQuery(query, [id]);
            res.json({ success: true, data: docentes });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtener inscripciones de una materia
     */
    async obtenerInscripcionesMateria(req, res, next) {
        try {
            const { id } = req.params;
            const { gestion = new Date().getFullYear() } = req.query;
            
            const query = `
                SELECT 
                    i.*,
                    e.nombre as estudiante_nombre,
                    e.apellido as estudiante_apellido,
                    e.ci as estudiante_ci
                FROM inscripciones i
                INNER JOIN estudiantes e ON i.id_estudiante = e.id_estudiante
                WHERE i.id_materia = ? AND i.gestion = ?
                ORDER BY e.apellido, e.nombre
            `;
            const inscripciones = await executeQuery(query, [id, gestion]);
            res.json({ success: true, data: inscripciones });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtener paralelos de una materia
     */
    async obtenerParalelosMateria(req, res, next) {
        try {
            const { id } = req.params;
            const { gestion = new Date().getFullYear() } = req.query;

            // Verificar que la materia existe
            const materiaExistente = await executeQuery(
                'SELECT id_materia FROM materias WHERE id_materia = ? AND activo = TRUE',
                [id]
            );

            if (materiaExistente.length === 0) {
                throw createError('Materia no encontrada o inactiva', 404);
            }

            // Obtener paralelos asignados a docentes para esta materia
            const query = `
                SELECT DISTINCT 
                    dm.paralelo,
                    dm.cerrado,
                    dm.fecha_cierre,
                    COUNT(i.id_inscripcion) as estudiantes_inscritos,
                    d.nombre as docente_nombre,
                    d.apellido as docente_apellido,
                    d.id_docente
                FROM docente_materias dm
                LEFT JOIN docentes d ON dm.id_docente = d.id_docente
                LEFT JOIN inscripciones i ON i.id_materia = dm.id_materia 
                    AND i.paralelo = dm.paralelo 
                    AND i.gestion = dm.gestion
                WHERE dm.id_materia = ? 
                    AND dm.gestion = ?
                GROUP BY dm.paralelo, dm.cerrado, dm.fecha_cierre, d.nombre, d.apellido, d.id_docente
                ORDER BY dm.paralelo ASC
            `;

            const paralelos = await executeQuery(query, [id, gestion]);

            res.json({
                success: true,
                data: paralelos
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Cerrar materia por docente o administrador
     * Actualiza el estado de todos los estudiantes inscritos en la materia
     */
    async cerrarMateria(req, res, next) {
        const connection = await getConnection();
        
        try {
            const { id } = req.params;
            const { gestion, periodo, paralelo } = req.body;
            const userId = req.user.id_usuario;
            const userRoles = req.user.roles || [];

            await connection.beginTransaction();

            let idDocente = null;
            const esAdministrador = userRoles.some(role => {
                if (typeof role === 'string') {
                    return role.toLowerCase() === 'administrador';
                } else if (typeof role === 'object' && role.nombre) {
                    return role.nombre.toLowerCase() === 'administrador';
                }
                return false;
            });

            if (esAdministrador) {
                const docenteAsignadoQuery = await connection.execute(
                    `SELECT id_docente FROM docente_materias 
                    WHERE id_materia = ? AND gestion = ? AND periodo = ? AND paralelo = ?`,
                    [id, gestion, periodo, paralelo]
                );

                if (docenteAsignadoQuery[0].length === 0) {
                    throw createError('No hay docente asignado a esta materia', 404);
                }

                idDocente = docenteAsignadoQuery[0][0].id_docente;
            } else {
                const docenteQuery = await connection.execute(
                    'SELECT id_docente FROM docentes WHERE id_usuario = ?',
                    [userId]
                );

                if (docenteQuery[0].length === 0) {
                    throw createError('Usuario no es docente', 403);
                }

                idDocente = docenteQuery[0][0].id_docente;

                const asignacionQuery = await connection.execute(
                    `SELECT * FROM docente_materias 
                    WHERE id_docente = ? AND id_materia = ? AND gestion = ? AND periodo = ? AND paralelo = ?`,
                    [idDocente, id, gestion, periodo, paralelo]
                );

                if (asignacionQuery[0].length === 0) {
                    throw createError('No está asignado a esta materia', 403);
                }
            }

            const estadoMateriaQuery = await connection.execute(
                `SELECT cerrado FROM docente_materias 
                WHERE id_docente = ? AND id_materia = ? AND gestion = ? AND periodo = ? AND paralelo = ?`,
                [idDocente, id, gestion, periodo, paralelo]
            );

            if (estadoMateriaQuery[0][0].cerrado) {
                throw createError('La materia ya ha sido cerrada', 400);
            }

            const inscripcionesQuery = await connection.execute(
                `SELECT i.id_inscripcion, i.id_estudiante
                FROM inscripciones i
                WHERE i.id_materia = ? AND i.gestion = ? AND i.periodo = ? AND i.paralelo = ? AND i.estado = 'inscrito'`,
                [id, gestion, periodo, paralelo]
            );

            const notaAprobacion = 51.00;
            let estadisticasActualizacion = {
                aprobados: 0,
                reprobados: 0,
                abandonados: 0
            };

            for (const inscripcion of inscripcionesQuery[0]) {
                const notasQuery = await connection.execute(
                    `SELECT COALESCE(SUM(n.calificacion * te.porcentaje / 100), 0) as nota_final,
                            COUNT(n.id_nota) as cantidad_notas
                    FROM notas n
                    INNER JOIN tipos_evaluacion te ON n.id_tipo_evaluacion = te.id_tipo_evaluacion
                    WHERE n.id_inscripcion = ? AND te.activo = TRUE`,
                    [inscripcion.id_inscripcion]
                );

                const notaFinal = notasQuery[0][0].nota_final;
                const cantidadNotas = notasQuery[0][0].cantidad_notas;

                let estado = 'reprobado';
                if (cantidadNotas === 0) {
                    estado = 'abandonado';
                    estadisticasActualizacion.abandonados++;
                } else if (notaFinal >= notaAprobacion) {
                    estado = 'aprobado';
                    estadisticasActualizacion.aprobados++;
                } else {
                    estadisticasActualizacion.reprobados++;
                }

                // Remove update to nota_final column as it does not exist
                await connection.execute(
                    `UPDATE inscripciones 
                    SET estado = ?, fecha_actualizacion = CURRENT_TIMESTAMP
                    WHERE id_inscripcion = ?`,
                    [estado, inscripcion.id_inscripcion]
                );

                await connection.execute(
                    `CALL sp_actualizar_historial_academico(?, ?)`,
                    [inscripcion.id_estudiante, gestion]
                );
            }

            await connection.execute(
                `UPDATE docente_materias
                SET cerrado = TRUE, fecha_cierre = CURRENT_TIMESTAMP, cerrado_por = ?
                WHERE id_docente = ? AND id_materia = ? AND gestion = ? AND periodo = ? AND paralelo = ?`,
                [userId, idDocente, id, gestion, periodo, paralelo]
            );

            await auditAction(req, 'docente_materias', 'UPDATE', null, 
                { cerrado: false }, 
                { 
                    cerrado: true,
                    accion: 'cierre_materia',
                    id_docente: idDocente,
                    id_materia: id,
                    gestion: gestion,
                    periodo: periodo,
                    paralelo: paralelo,
                    estudiantes_actualizados: inscripcionesQuery[0].length,
                    estadisticas: estadisticasActualizacion,
                    cerrado_por: esAdministrador ? 'Administrador' : 'Docente'
                }
            );

            await connection.commit();

            const estadisticasQuery = await executeQuery(
                `SELECT 
                    COUNT(*) as total_estudiantes,
                    COUNT(CASE WHEN estado = 'aprobado' THEN 1 END) as aprobados,
                    COUNT(CASE WHEN estado = 'reprobado' THEN 1 END) as reprobados,
                    COUNT(CASE WHEN estado = 'abandonado' THEN 1 END) as abandonados
                FROM inscripciones
                WHERE id_materia = ? AND gestion = ? AND periodo = ? AND paralelo = ?`,
                [id, gestion, periodo, paralelo]
            );

            res.json({
                success: true,
                message: 'Materia cerrada exitosamente',
                data: {
                    estadisticas: estadisticasQuery[0],
                    cerrado_por: esAdministrador ? 'Administrador' : 'Docente'
                }
            });

        } catch (error) {
            await connection.rollback();
            next(error);
        } finally {
            connection.release();
        }
    }

    /**
     * Obtener estado de cierre de materias para un docente o administrador
     */
    async obtenerEstadoCierreMaterias(req, res, next) {
        try {
            const userId = req.user.id_usuario;
            const userRoles = req.user.roles || [];
            const {
                gestion = '',
                periodo = '',
                estado = '',
                search = '',
                page = 1,
                limit = 10
            } = req.query;

            const offset = (parseInt(page) - 1) * parseInt(limit);
            const limitNum = Math.min(parseInt(limit), 100);

            // Check if user has Administrator role
            const esAdministrador = userRoles.some(role => {
                if (typeof role === 'string') {
                    return role.toLowerCase() === 'administrador';
                } else if (typeof role === 'object' && role.nombre) {
                    return role.nombre.toLowerCase() === 'administrador';
                }
                return false;
            });

            let whereConditions = [];
            let queryParams = [];

            if (esAdministrador) {
                // Administrador puede ver todas las materias
                if (gestion) {
                    whereConditions.push('dm.gestion = ?');
                    queryParams.push(gestion);
                }
                if (periodo) {
                    whereConditions.push('dm.periodo = ?');
                    queryParams.push(periodo);
                }
            } else {
                // Docente solo ve sus materias
                const docenteQuery = await executeQuery(
                    'SELECT id_docente FROM docentes WHERE id_usuario = ?',
                    [userId]
                );

                if (docenteQuery.length === 0) {
                    return res.json({
                        success: true,
                        data: [],
                        message: 'Usuario no tiene rol de docente'
                    });
                }

                const idDocente = docenteQuery[0].id_docente;
                whereConditions.push('dm.id_docente = ?');
                queryParams.push(idDocente);

                if (gestion) {
                    whereConditions.push('dm.gestion = ?');
                    queryParams.push(gestion);
                }
                if (periodo) {
                    whereConditions.push('dm.periodo = ?');
                    queryParams.push(periodo);
                }
            }

            // Estado filter
            if (estado) {
                if (estado === 'cerrado') {
                    whereConditions.push('dm.cerrado = TRUE');
                } else if (estado === 'abierto') {
                    whereConditions.push('dm.cerrado = FALSE');
                }
            }

            // Search filter
            if (search) {
                const searchTerm = `%${search}%`;
                if (esAdministrador) {
                    whereConditions.push('(m.nombre LIKE ? OR m.sigla LIKE ? OR d.nombre LIKE ? OR d.apellido LIKE ?)');
                    queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
                } else {
                    whereConditions.push('(m.nombre LIKE ? OR m.sigla LIKE ?)');
                    queryParams.push(searchTerm, searchTerm);
                }
            }

            const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

            // Count total for pagination
            const countQuery = `
                SELECT COUNT(DISTINCT dm.id_docente, dm.id_materia, dm.gestion, dm.periodo, dm.paralelo) as total
                FROM docente_materias dm
                INNER JOIN materias m ON dm.id_materia = m.id_materia
                INNER JOIN docentes d ON dm.id_docente = d.id_docente
                ${whereClause}
            `;

            const countResult = await executeQuery(countQuery, queryParams);
            const total = countResult[0].total;
            const totalPages = Math.ceil(total / limitNum);

            // Main query with pagination
            const mainQuery = `
                SELECT 
                    dm.*,
                    m.nombre as materia_nombre,
                    m.sigla as materia_sigla,
                    m.semestre,
                    d.nombre as docente_nombre,
                    d.apellido as docente_apellido,
                    COUNT(i.id_inscripcion) as total_estudiantes,
                    COUNT(CASE WHEN i.estado = 'aprobado' THEN 1 END) as aprobados,
                    COUNT(CASE WHEN i.estado = 'reprobado' THEN 1 END) as reprobados,
                    COUNT(CASE WHEN i.estado = 'abandonado' THEN 1 END) as abandonados,
                    COUNT(CASE WHEN i.estado = 'inscrito' THEN 1 END) as inscritos
                FROM docente_materias dm
                INNER JOIN materias m ON dm.id_materia = m.id_materia
                INNER JOIN docentes d ON dm.id_docente = d.id_docente
                LEFT JOIN inscripciones i ON i.id_materia = dm.id_materia 
                    AND i.gestion = dm.gestion 
                    AND i.periodo = dm.periodo 
                    AND i.paralelo = dm.paralelo
                ${whereClause}
                GROUP BY dm.id_docente, dm.id_materia, dm.gestion, dm.periodo, dm.paralelo
                ORDER BY m.nombre, dm.paralelo
                LIMIT ? OFFSET ?
            `;

            queryParams.push(limitNum, offset);

            const materias = await executeQuery(mainQuery, queryParams);

            res.json({
                success: true,
                data: materias,
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
     * Abrir/reabrir materia (solo administradores)
     */
    async abrirMateria(req, res, next) {
        try {
            const { id } = req.params;
            const { gestion, periodo, paralelo, idDocente } = req.body;

            // Verificar que es administrador
            const userRoles = req.user.roles || [];
            const esAdministrador = userRoles.some(role => {
                if (typeof role === 'string') {
                    return role.toLowerCase() === 'administrador';
                } else if (typeof role === 'object' && role.nombre) {
                    return role.nombre.toLowerCase() === 'administrador';
                }
                return false;
            });

            if (!esAdministrador) {
                throw createError('Solo los administradores pueden abrir materias', 403);
            }

            // Verificar que la materia-docente existe
            const asignacionQuery = await executeQuery(
                `SELECT * FROM docente_materias 
                WHERE id_docente = ? AND id_materia = ? AND gestion = ? AND periodo = ? AND paralelo = ?`,
                [idDocente, id, gestion, periodo, paralelo]
            );

            if (asignacionQuery.length === 0) {
                throw createError('Asignación docente-materia no encontrada', 404);
            }

            // Abrir la materia
            await executeQuery(
                `UPDATE docente_materias
                SET cerrado = FALSE, fecha_cierre = NULL, cerrado_por = NULL
                WHERE id_docente = ? AND id_materia = ? AND gestion = ? AND periodo = ? AND paralelo = ?`,
                [idDocente, id, gestion, periodo, paralelo]
            );

            // Cambiar estado de inscripciones a 'inscrito'
            await executeQuery(
                `UPDATE inscripciones
                SET estado = 'inscrito'
                WHERE id_materia = ? AND gestion = ? AND periodo = ? AND paralelo = ?`,
                [id, gestion, periodo, paralelo]
            );

            // Auditar acción
            await auditAction(req, 'docente_materias', 'UPDATE', null,
                { cerrado: true },
                { 
                    cerrado: false,
                    accion: 'apertura_materia',
                    id_docente: idDocente,
                    id_materia: id,
                    gestion: gestion,
                    periodo: periodo,
                    paralelo: paralelo
                }
            );

            res.json({
                success: true,
                message: 'Materia abierta exitosamente'
            });

        } catch (error) {
            next(error);
        }
    }
}

// Crear instancia del controlador
const controller = new MateriaController();

// Exportar métodos
module.exports = {
    listarMaterias: controller.listarMaterias.bind(controller),
    obtenerMateria: controller.obtenerMateria.bind(controller),
    crearMateria: controller.crearMateria.bind(controller),
    actualizarMateria: controller.actualizarMateria.bind(controller),
    eliminarMateria: controller.eliminarMateria.bind(controller),
    obtenerEstadisticas: controller.obtenerEstadisticas.bind(controller),
    obtenerMateriasPorMencion: controller.obtenerMateriasPorMencion.bind(controller),
    obtenerPrerequisitos: controller.obtenerPrerequisitos.bind(controller),
    obtenerDocentesMateria: controller.obtenerDocentesMateria.bind(controller),
    obtenerInscripcionesMateria: controller.obtenerInscripcionesMateria.bind(controller),
    obtenerParalelosMateria: controller.obtenerParalelosMateria.bind(controller),
    cerrarMateria: controller.cerrarMateria.bind(controller),
    obtenerEstadoCierreMaterias: controller.obtenerEstadoCierreMaterias.bind(controller),
    abrirMateria: controller.abrirMateria.bind(controller)
};
