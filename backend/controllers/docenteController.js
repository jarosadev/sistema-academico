const { executeQuery } = require('../config/database');
const { createError } = require('../middleware/errorHandler');
const { auditAction } = require('../middleware/audit-complete');

/**
 * Controlador para gestión de docentes
 */
class DocenteController {
    /**
     * Listar docentes con paginación y filtros
     */
    async listarDocentes(req, res, next) {
        try {
            const {
                page = 1,
                limit = 10,
                search = '',
                especialidad = '',
                activo = '',
                sortBy = 'nombre',
                sortOrder = 'ASC'
            } = req.query;

            const offset = (parseInt(page) - 1) * parseInt(limit);
            const limitNum = Math.min(parseInt(limit), 100);

            // Construir condiciones WHERE
            let whereConditions = ['d.id_docente IS NOT NULL'];
            let queryParams = [];

            if (search) {
                whereConditions.push('(d.nombre LIKE ? OR d.apellido LIKE ? OR d.ci LIKE ?)');
                const searchTerm = `%${search}%`;
                queryParams.push(searchTerm, searchTerm, searchTerm);
            }

            if (especialidad) {
                whereConditions.push('d.especialidad LIKE ?');
                queryParams.push(`%${especialidad}%`);
            }

            if (activo !== '') {
                whereConditions.push('d.activo = ?');
                queryParams.push(activo === 'true');
            }

            const whereClause = whereConditions.join(' AND ');

            const query = `
                SELECT 
                    d.id_docente,
                    d.nombre,
                    d.apellido,
                    d.ci,
                    d.especialidad,
                    d.telefono,
                    d.activo,
                    d.fecha_contratacion,
                    d.fecha_creacion,
                    u.correo,
                    u.activo as usuario_activo,
                    COUNT(dm.id_materia) as materias_asignadas
                FROM docentes d
                LEFT JOIN usuarios u ON d.id_usuario = u.id_usuario
                LEFT JOIN docente_materias dm ON d.id_docente = dm.id_docente
                WHERE ${whereClause}
                GROUP BY d.id_docente
                ORDER BY d.${sortBy} ${sortOrder}
                LIMIT ${limitNum} OFFSET ${offset}
            `;

            const countQuery = `
                SELECT COUNT(DISTINCT d.id_docente) as total
                FROM docentes d
                LEFT JOIN usuarios u ON d.id_usuario = u.id_usuario
                WHERE ${whereClause}
            `;

            const [docentes, countResult] = await Promise.all([
                executeQuery(query, queryParams),
                executeQuery(countQuery, queryParams)
            ]);

            const total = countResult[0].total;
            const totalPages = Math.ceil(total / limitNum);

            res.json({
                success: true,
                data: docentes,
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
     * Obtener docente por ID
     */
    async obtenerDocente(req, res, next) {
        try {
            const { id } = req.params;

            const query = `
                SELECT 
                    d.*,
                    u.correo,
                    u.activo as usuario_activo,
                    u.ultimo_acceso
                FROM docentes d
                LEFT JOIN usuarios u ON d.id_usuario = u.id_usuario
                WHERE d.id_docente = ?
            `;

            const docentes = await executeQuery(query, [id]);

            if (docentes.length === 0) {
                throw createError('Docente no encontrado', 404);
            }

            // Obtener materias asignadas
            const materiasQuery = `
                SELECT 
                    m.id_materia,
                    m.nombre as materia_nombre,
                    m.sigla,
                    m.semestre,
                    men.nombre as mencion_nombre,
                    dm.gestion,
                    dm.paralelo,
                    dm.fecha_asignacion
                FROM docente_materias dm
                INNER JOIN materias m ON dm.id_materia = m.id_materia
                INNER JOIN menciones men ON m.id_mencion = men.id_mencion
                WHERE dm.id_docente = ?
                ORDER BY dm.gestion DESC, m.semestre ASC
            `;

            const materias = await executeQuery(materiasQuery, [id]);

            res.json({
                success: true,
                data: {
                    ...docentes[0],
                    materias_asignadas: materias
                }
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Crear nuevo docente
     */
    async crearDocente(req, res, next) {
        try {
            const { nombre, apellido, ci, especialidad, telefono, correo } = req.body;

            // Verificar que el CI no esté registrado
            const ciExistente = await executeQuery(
                'SELECT id_docente FROM docentes WHERE ci = ?',
                [ci]
            );

            if (ciExistente.length > 0) {
                throw createError('Ya existe un docente registrado con este CI', 409);
            }

            // Verificar que el correo no esté registrado
            const correoExistente = await executeQuery(
                'SELECT id_usuario FROM usuarios WHERE correo = ?',
                [correo]
            );

            if (correoExistente.length > 0) {
                throw createError('El correo electrónico ya está registrado', 409);
            }

            // Crear usuario
            const usuarioQuery = `
                INSERT INTO usuarios (correo, rol, activo)
                VALUES (?, 'DOCENTE', TRUE)
            `;

            const usuarioResult = await executeQuery(usuarioQuery, [correo]);
            const id_usuario = usuarioResult.insertId;

            // Crear docente
            const docenteQuery = `
                INSERT INTO docentes (
                    id_usuario, nombre, apellido, ci, 
                    especialidad, telefono, activo, 
                    fecha_contratacion, fecha_creacion
                ) VALUES (
                    ?, ?, ?, ?, 
                    ?, ?, TRUE, 
                    CURDATE(), NOW()
                )
            `;

            const docenteResult = await executeQuery(docenteQuery, [
                id_usuario, nombre, apellido, ci,
                especialidad, telefono
            ]);

            // Auditar acción
            await auditAction(req, 'docentes', 'INSERT', null, null, {
                id_docente: docenteResult.insertId,
                nombre,
                apellido,
                ci,
                especialidad,
                telefono,
                correo
            });

            res.status(201).json({
                success: true,
                message: 'Docente creado exitosamente',
                data: {
                    id_docente: docenteResult.insertId,
                    id_usuario,
                    nombre,
                    apellido,
                    ci,
                    especialidad,
                    telefono,
                    correo,
                    activo: true
                }
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Actualizar docente
     */
    async actualizarDocente(req, res, next) {
        try {
            const { id } = req.params;
            const { nombre, apellido, ci, especialidad, telefono, correo, activo } = req.body;

            // Verificar que el docente existe
            const docenteExistente = await executeQuery(
                'SELECT d.*, u.correo FROM docentes d LEFT JOIN usuarios u ON d.id_usuario = u.id_usuario WHERE d.id_docente = ?',
                [id]
            );

            if (docenteExistente.length === 0) {
                throw createError('Docente no encontrado', 404);
            }

            const docente = docenteExistente[0];

            // Verificar CI único si cambió
            if (ci !== docente.ci) {
                const ciExistente = await executeQuery(
                    'SELECT id_docente FROM docentes WHERE ci = ? AND id_docente != ?',
                    [ci, id]
                );

                if (ciExistente.length > 0) {
                    throw createError('Ya existe un docente registrado con este CI', 409);
                }
            }

            // Verificar correo único si cambió
            if (correo !== docente.correo) {
                const correoExistente = await executeQuery(
                    'SELECT id_usuario FROM usuarios WHERE correo = ? AND id_usuario != ?',
                    [correo, docente.id_usuario]
                );

                if (correoExistente.length > 0) {
                    throw createError('El correo electrónico ya está registrado', 409);
                }

                // Actualizar correo en usuarios
                await executeQuery(
                    'UPDATE usuarios SET correo = ? WHERE id_usuario = ?',
                    [correo, docente.id_usuario]
                );
            }

            // Actualizar estado en usuarios si cambió
            if (activo !== undefined && activo !== docente.activo) {
                await executeQuery(
                    'UPDATE usuarios SET activo = ? WHERE id_usuario = ?',
                    [activo, docente.id_usuario]
                );
            }

            // Actualizar docente
            const query = `
                UPDATE docentes 
                SET nombre = ?, 
                    apellido = ?, 
                    ci = ?, 
                    especialidad = ?, 
                    telefono = ?,
                    activo = ?
                WHERE id_docente = ?
            `;

            await executeQuery(query, [
                nombre,
                apellido,
                ci,
                especialidad,
                telefono,
                activo !== undefined ? activo : docente.activo,
                id
            ]);

            // Auditar acción
            await auditAction(req, 'docentes', 'UPDATE', docente, {
                ...docente,
                nombre,
                apellido,
                ci,
                especialidad,
                telefono,
                correo,
                activo: activo !== undefined ? activo : docente.activo
            }, null);

            res.json({
                success: true,
                message: 'Docente actualizado exitosamente',
                data: {
                    id_docente: parseInt(id),
                    id_usuario: docente.id_usuario,
                    nombre,
                    apellido,
                    ci,
                    especialidad,
                    telefono,
                    correo,
                    activo: activo !== undefined ? activo : docente.activo
                }
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Eliminar docente
     */
    async eliminarDocente(req, res, next) {
        try {
            const { id } = req.params;

            // Verificar que el docente existe
            const docenteExistente = await executeQuery(
                'SELECT d.*, u.correo FROM docentes d LEFT JOIN usuarios u ON d.id_usuario = u.id_usuario WHERE d.id_docente = ?',
                [id]
            );

            if (docenteExistente.length === 0) {
                throw createError('Docente no encontrado', 404);
            }

            const docente = docenteExistente[0];

            // Verificar que no tenga materias asignadas actualmente
            const materiasAsignadas = await executeQuery(
                'SELECT COUNT(*) as total FROM docente_materias WHERE id_docente = ?',
                [id]
            );

            if (materiasAsignadas[0].total > 0) {
                throw createError('No se puede eliminar el docente porque tiene materias asignadas', 400);
            }

            // Verificar que no tenga notas registradas
            const notasRegistradas = await executeQuery(
                'SELECT COUNT(*) as total FROM notas WHERE id_docente = ?',
                [id]
            );

            if (notasRegistradas[0].total > 0) {
                throw createError('No se puede eliminar el docente porque tiene notas registradas', 400);
            }

            // Eliminar docente
            await executeQuery('DELETE FROM docentes WHERE id_docente = ?', [id]);

            // Eliminar usuario asociado
            if (docente.id_usuario) {
                await executeQuery('DELETE FROM usuarios WHERE id_usuario = ?', [docente.id_usuario]);
            }

            // Auditar acción
            await auditAction(req, 'docentes', 'DELETE', docente, null, null);

            res.json({
                success: true,
                message: 'Docente eliminado exitosamente'
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Asignar materia a docente
     */
    async asignarMateria(req, res, next) {
        try {
            const { id } = req.params;
            const { id_materia, gestion, paralelo = 'A' } = req.body;

            // Verificar que el docente existe y está activo
            const docenteExistente = await executeQuery(
                'SELECT * FROM docentes WHERE id_docente = ? AND activo = TRUE',
                [id]
            );

            if (docenteExistente.length === 0) {
                throw createError('Docente no encontrado o inactivo', 404);
            }

            // Verificar que la materia existe
            const materiaExistente = await executeQuery(
                'SELECT * FROM materias WHERE id_materia = ? AND activo = TRUE',
                [id_materia]
            );

            if (materiaExistente.length === 0) {
                throw createError('Materia no encontrada o inactiva', 404);
            }

            // Verificar que no esté ya asignada al mismo docente
            const asignacionExistente = await executeQuery(
                'SELECT * FROM docente_materias WHERE id_docente = ? AND id_materia = ? AND gestion = ? AND paralelo = ?',
                [id, id_materia, gestion, paralelo]
            );

            if (asignacionExistente.length > 0) {
                throw createError('El docente ya tiene asignada esta materia en esta gestión y paralelo', 409);
            }

            // Verificar que otro docente no tenga asignada la misma materia-paralelo
            const asignacionOtroDocente = await executeQuery(
                'SELECT d.nombre, d.apellido FROM docente_materias dm ' +
                'INNER JOIN docentes d ON dm.id_docente = d.id_docente ' +
                'WHERE dm.id_materia = ? AND dm.gestion = ? AND dm.paralelo = ?',
                [id_materia, gestion, paralelo]
            );

            if (asignacionOtroDocente.length > 0) {
                const docente = asignacionOtroDocente[0];
                throw createError(
                    `La materia ya está asignada al docente ${docente.nombre} ${docente.apellido} en el paralelo ${paralelo}`,
                    409
                );
            }

            // Crear asignación
            const query = `
                INSERT INTO docente_materias (id_docente, id_materia, gestion, paralelo)
                VALUES (?, ?, ?, ?)
            `;

            await executeQuery(query, [id, id_materia, gestion, paralelo]);

            // Auditar acción
            await auditAction(req, 'docente_materias', 'INSERT', null, null, {
                id_docente: id, id_materia, gestion, paralelo
            });

            res.status(201).json({
                success: true,
                message: 'Materia asignada exitosamente',
                data: {
                    id_docente: parseInt(id),
                    id_materia: parseInt(id_materia),
                    gestion: parseInt(gestion),
                    paralelo
                }
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Remover asignación de materia
     */
    async removerMateria(req, res, next) {
        try {
            const { id, id_materia } = req.params;
            const { gestion, paralelo = 'A' } = req.query;

            // Verificar que la asignación existe
            const asignacionExistente = await executeQuery(
                'SELECT * FROM docente_materias WHERE id_docente = ? AND id_materia = ? AND gestion = ? AND paralelo = ?',
                [id, id_materia, gestion, paralelo]
            );

            if (asignacionExistente.length === 0) {
                throw createError('Asignación no encontrada', 404);
            }

            // Verificar que no haya notas registradas
            const notasExistentes = await executeQuery(`
                SELECT COUNT(*) as total 
                FROM notas n
                INNER JOIN inscripciones i ON n.id_inscripcion = i.id_inscripcion
                WHERE i.id_materia = ? AND i.gestion = ? AND n.id_docente = ?
            `, [id_materia, gestion, id]);

            if (notasExistentes[0].total > 0) {
                throw createError('No se puede remover la asignación porque ya hay notas registradas', 400);
            }

            // Remover asignación
            const query = `
                DELETE FROM docente_materias 
                WHERE id_docente = ? AND id_materia = ? AND gestion = ? AND paralelo = ?
            `;

            await executeQuery(query, [id, id_materia, gestion, paralelo]);

            // Auditar acción
            await auditAction(req, 'docente_materias', 'DELETE', null, asignacionExistente[0], null);

            res.json({
                success: true,
                message: 'Asignación removida exitosamente'
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtener materias asignadas a un docente
     */
    async obtenerMateriasPorDocente(req, res, next) {
        try {
            const { id } = req.params;
            const query = `
                SELECT 
                    m.*,
                    dm.gestion,
                    dm.paralelo,
                    men.nombre as mencion_nombre,
                    COUNT(DISTINCT i.id_inscripcion) as estudiantes_inscritos
                FROM docente_materias dm
                INNER JOIN materias m ON dm.id_materia = m.id_materia
                INNER JOIN menciones men ON m.id_mencion = men.id_mencion
                LEFT JOIN inscripciones i ON m.id_materia = i.id_materia AND i.gestion = dm.gestion
                WHERE dm.id_docente = ?
                GROUP BY m.id_materia, dm.gestion, dm.paralelo
                ORDER BY dm.gestion DESC, m.semestre, m.nombre
            `;
            const materias = await executeQuery(query, [id]);
            res.json({ success: true, data: materias });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtener estadísticas de docentes
     */
    async obtenerEstadisticas(req, res, next) {
        try {
            const estadisticasQuery = `
                SELECT 
                    COUNT(*) as total_docentes,
                    COUNT(CASE WHEN activo = TRUE THEN 1 END) as activos,
                    COUNT(CASE WHEN activo = FALSE THEN 1 END) as inactivos
                FROM docentes
            `;

            const porEspecialidadQuery = `
                SELECT 
                    especialidad,
                    COUNT(*) as cantidad
                FROM docentes
                WHERE activo = TRUE AND especialidad IS NOT NULL
                GROUP BY especialidad
                ORDER BY cantidad DESC
            `;

            const cargaAcademicaQuery = `
                SELECT 
                    d.nombre,
                    d.apellido,
                    COUNT(dm.id_materia) as materias_asignadas
                FROM docentes d
                LEFT JOIN docente_materias dm ON d.id_docente = dm.id_docente AND dm.gestion = YEAR(CURDATE())
                WHERE d.activo = TRUE
                GROUP BY d.id_docente
                ORDER BY materias_asignadas DESC
                LIMIT 10
            `;

            const [estadisticas, porEspecialidad, cargaAcademica] = await Promise.all([
                executeQuery(estadisticasQuery),
                executeQuery(porEspecialidadQuery),
                executeQuery(cargaAcademicaQuery)
            ]);

            res.json({
                success: true,
                data: {
                    resumen: estadisticas[0],
                    por_especialidad: porEspecialidad,
                    carga_academica: cargaAcademica
                }
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtener estudiantes por docente
     */
    async obtenerEstudiantesPorDocente(req, res, next) {
        try {
            const { id } = req.params;
            const query = `
                SELECT DISTINCT
                    e.*,
                    u.correo,
                    u.activo as usuario_activo,
                    m.nombre as materia_nombre,
                    dm.gestion,
                    dm.paralelo
                FROM docente_materias dm
                INNER JOIN inscripciones i ON dm.id_materia = i.id_materia AND dm.gestion = i.gestion
                INNER JOIN estudiantes e ON i.id_estudiante = e.id_estudiante
                INNER JOIN usuarios u ON e.id_usuario = u.id_usuario
                INNER JOIN materias m ON dm.id_materia = m.id_materia
                WHERE dm.id_docente = ?
                ORDER BY e.apellido, e.nombre, dm.gestion DESC
            `;
            const estudiantes = await executeQuery(query, [id]);
            res.json({ success: true, data: estudiantes });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtener carga académica del docente
     */
    async obtenerCargaAcademica(req, res, next) {
        try {
            const { id } = req.params;
            const query = `
                SELECT 
                    m.*,
                    dm.gestion,
                    dm.paralelo,
                    men.nombre as mencion_nombre,
                    COUNT(DISTINCT i.id_inscripcion) as estudiantes_inscritos
                FROM docente_materias dm
                INNER JOIN materias m ON dm.id_materia = m.id_materia
                INNER JOIN menciones men ON m.id_mencion = men.id_mencion
                LEFT JOIN inscripciones i ON m.id_materia = i.id_materia AND i.gestion = dm.gestion
                WHERE dm.id_docente = ?
                GROUP BY m.id_materia, dm.gestion, dm.paralelo
                ORDER BY dm.gestion DESC, m.semestre, m.nombre
            `;
            const carga = await executeQuery(query, [id]);
            res.json({ success: true, data: carga });
        } catch (error) {
            next(error);
        }
    }
}

const controller = new DocenteController();

module.exports = {
    listarDocentes: controller.listarDocentes.bind(controller),
    obtenerDocente: controller.obtenerDocente.bind(controller),
    crearDocente: controller.crearDocente.bind(controller),
    actualizarDocente: controller.actualizarDocente.bind(controller),
    eliminarDocente: controller.eliminarDocente.bind(controller),
    obtenerEstadisticas: controller.obtenerEstadisticas.bind(controller),
    asignarMateria: controller.asignarMateria.bind(controller),
    removerMateria: controller.removerMateria.bind(controller),
    obtenerMateriasPorDocente: controller.obtenerMateriasPorDocente.bind(controller),
    obtenerEstudiantesPorDocente: controller.obtenerEstudiantesPorDocente.bind(controller),
    obtenerCargaAcademica: controller.obtenerCargaAcademica.bind(controller)
};
