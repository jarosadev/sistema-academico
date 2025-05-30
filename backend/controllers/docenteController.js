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

            // Consulta principal con JOIN
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

            // Consulta para contar total
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
                throw createError(404, 'Docente no encontrado');
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
            const {
                nombre,
                apellido,
                ci,
                especialidad,
                telefono,
                correo,
                password,
                fecha_contratacion
            } = req.body;

            // Verificar que el CI no exista
            const ciExistente = await executeQuery(
                'SELECT id_docente FROM docentes WHERE ci = ?',
                [ci]
            );

            if (ciExistente.length > 0) {
                throw createError(409, 'Ya existe un docente con ese CI');
            }

            // Verificar que el correo no exista
            const correoExistente = await executeQuery(
                'SELECT id_usuario FROM usuarios WHERE correo = ?',
                [correo]
            );

            if (correoExistente.length > 0) {
                throw createError(409, 'Ya existe un usuario con ese correo');
            }

            // Crear usuario primero
            const bcrypt = require('bcrypt');
            const hashedPassword = await bcrypt.hash(password, 12);

            const usuarioQuery = `
                INSERT INTO usuarios (correo, password, activo)
                VALUES (?, ?, TRUE)
            `;

            const usuarioResult = await executeQuery(usuarioQuery, [correo, hashedPassword]);
            const idUsuario = usuarioResult.insertId;

            // Asignar rol de docente
            const rolDocenteQuery = `
                INSERT INTO usuario_roles (id_usuario, id_rol)
                SELECT ?, id_rol FROM roles WHERE nombre = 'docente'
            `;

            await executeQuery(rolDocenteQuery, [idUsuario]);

            // Crear docente
            const docenteQuery = `
                INSERT INTO docentes (
                    nombre, apellido, ci, especialidad, telefono,
                    id_usuario, activo, fecha_contratacion
                ) VALUES (?, ?, ?, ?, ?, ?, TRUE, ?)
            `;

            const docenteResult = await executeQuery(docenteQuery, [
                nombre, apellido, ci, especialidad, telefono,
                idUsuario, fecha_contratacion || new Date()
            ]);

            // Auditar acción
            await auditAction(req, 'docentes', 'INSERT', docenteResult.insertId, null, {
                nombre, apellido, ci, especialidad, correo
            });

            res.status(201).json({
                success: true,
                message: 'Docente creado exitosamente',
                data: {
                    id_docente: docenteResult.insertId,
                    id_usuario: idUsuario,
                    nombre,
                    apellido,
                    ci,
                    especialidad,
                    correo
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
            const {
                nombre,
                apellido,
                especialidad,
                telefono,
                activo,
                fecha_contratacion
            } = req.body;

            // Verificar que el docente existe
            const docenteExistente = await executeQuery(
                'SELECT * FROM docentes WHERE id_docente = ?',
                [id]
            );

            if (docenteExistente.length === 0) {
                throw createError(404, 'Docente no encontrado');
            }

            const datosAnteriores = docenteExistente[0];

            // Actualizar docente
            const query = `
                UPDATE docentes SET
                    nombre = ?,
                    apellido = ?,
                    especialidad = ?,
                    telefono = ?,
                    activo = ?,
                    fecha_contratacion = ?,
                    fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id_docente = ?
            `;

            await executeQuery(query, [
                nombre, apellido, especialidad, telefono,
                activo, fecha_contratacion, id
            ]);

            // Auditar acción
            await auditAction(req, 'docentes', 'UPDATE', id, datosAnteriores, {
                nombre, apellido, especialidad, telefono, activo, fecha_contratacion
            });

            res.json({
                success: true,
                message: 'Docente actualizado exitosamente',
                data: {
                    id_docente: parseInt(id),
                    nombre,
                    apellido,
                    especialidad,
                    activo
                }
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Eliminar docente (soft delete)
     */
    async eliminarDocente(req, res, next) {
        try {
            const { id } = req.params;

            // Verificar que el docente existe
            const docenteExistente = await executeQuery(
                'SELECT * FROM docentes WHERE id_docente = ?',
                [id]
            );

            if (docenteExistente.length === 0) {
                throw createError(404, 'Docente no encontrado');
            }

            // Verificar que no tenga materias asignadas actualmente
            const materiasActivas = await executeQuery(
                'SELECT COUNT(*) as total FROM docente_materias WHERE id_docente = ? AND gestion = YEAR(CURDATE())',
                [id]
            );

            if (materiasActivas[0].total > 0) {
                throw createError(400, 'No se puede eliminar un docente con materias asignadas en la gestión actual');
            }

            // Cambiar estado a inactivo
            const query = `
                UPDATE docentes SET
                    activo = FALSE,
                    fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id_docente = ?
            `;

            await executeQuery(query, [id]);

            // También desactivar usuario
            const usuarioQuery = `
                UPDATE usuarios SET activo = FALSE
                WHERE id_usuario = ?
            `;

            await executeQuery(usuarioQuery, [docenteExistente[0].id_usuario]);

            // Auditar acción
            await auditAction(req, 'docentes', 'UPDATE', id, docenteExistente[0], {
                activo: false
            });

            res.json({
                success: true,
                message: 'Docente desactivado exitosamente'
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
                throw createError(404, 'Docente no encontrado o inactivo');
            }

            // Verificar que la materia existe
            const materiaExistente = await executeQuery(
                'SELECT * FROM materias WHERE id_materia = ? AND activo = TRUE',
                [id_materia]
            );

            if (materiaExistente.length === 0) {
                throw createError(404, 'Materia no encontrada o inactiva');
            }

            // Verificar que no esté ya asignada
            const asignacionExistente = await executeQuery(
                'SELECT * FROM docente_materias WHERE id_docente = ? AND id_materia = ? AND gestion = ? AND paralelo = ?',
                [id, id_materia, gestion, paralelo]
            );

            if (asignacionExistente.length > 0) {
                throw createError(409, 'El docente ya tiene asignada esta materia en esta gestión y paralelo');
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
                throw createError(404, 'Asignación no encontrada');
            }

            // Verificar que no haya notas registradas
            const notasExistentes = await executeQuery(`
                SELECT COUNT(*) as total 
                FROM notas n
                INNER JOIN inscripciones i ON n.id_inscripcion = i.id_inscripcion
                WHERE i.id_materia = ? AND i.gestion = ? AND n.id_docente = ?
            `, [id_materia, gestion, id]);

            if (notasExistentes[0].total > 0) {
                throw createError(400, 'No se puede remover la asignación porque ya hay notas registradas');
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
}

const controller = new DocenteController();

module.exports = {
    listarDocentes: controller.listarDocentes.bind(controller),
    obtenerDocente: controller.obtenerDocente.bind(controller),
    crearDocente: controller.crearDocente.bind(controller),
    actualizarDocente: controller.actualizarDocente.bind(controller),
    eliminarDocente: controller.eliminarDocente.bind(controller),
    obtenerEstadisticas: controller.obtenerEstadisticas.bind(controller),
    // Funciones adicionales que pueden faltar
    obtenerCargaAcademica: async (req, res, next) => {
        try {
            const { id } = req.params;
            const query = `
                SELECT 
                    m.*,
                    COUNT(i.id_inscripcion) as estudiantes_inscritos
                FROM materias m
                LEFT JOIN inscripciones i ON m.id_materia = i.id_materia
                WHERE m.id_docente = ?
                GROUP BY m.id_materia
                ORDER BY m.semestre, m.nombre
            `;
            const carga = await executeQuery(query, [id]);
            res.json({ success: true, data: carga });
        } catch (error) {
            next(error);
        }
    },
    asignarMateria: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { id_materia } = req.body;
            
            const query = `
                UPDATE materias 
                SET id_docente = ?
                WHERE id_materia = ?
            `;
            
            await executeQuery(query, [id, id_materia]);
            res.json({ 
                success: true, 
                message: 'Materia asignada exitosamente' 
            });
        } catch (error) {
            next(error);
        }
    }
};
