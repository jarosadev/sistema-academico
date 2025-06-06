const { executeQuery, pool } = require('../config/database');
const { createError } = require('../middleware/errorHandler');
const { auditAction } = require('../middleware/audit-complete');
const bcrypt = require('bcrypt');

class EstudianteController {

    /**
    * Listar estudiantes con paginación y filtros
    */
    async listarEstudiantes(req, res, next) {
        try {
            let {
                page = 1,
                limit = 10,
                search = '',
                mencion = '',
                estado = '',
                sortBy = 'nombre',
                sortOrder = 'ASC'
            } = req.query;

            // Validaciones y sanitización
            const validSortFields = ['nombre', 'apellido', 'ci', 'fecha_ingreso', 'estado_academico', 'fecha_creacion'];
            const validSortOrders = ['ASC', 'DESC'];

            const sortField = validSortFields.includes(sortBy) ? sortBy : 'nombre';
            const order = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';

            const pageNum = Math.max(1, parseInt(page)) || 1;
            const limitNum = Math.min(Math.max(1, parseInt(limit)) || 10, 100);
            const offset = (pageNum - 1) * limitNum;

            // WHERE dinámico
            const whereConditions = ['e.id_estudiante IS NOT NULL'];
            const queryParams = [];

            if (search) {
                whereConditions.push('(e.nombre LIKE ? OR e.apellido LIKE ? OR e.ci LIKE ?)');
                const searchTerm = `%${search}%`;
                queryParams.push(searchTerm, searchTerm, searchTerm);
            }

            if (mencion) {
                whereConditions.push('e.id_mencion = ?');
                queryParams.push(mencion);
            }

            if (estado) {
                whereConditions.push('e.estado_academico = ?');
                queryParams.push(estado);
            }

            const whereClause = whereConditions.join(' AND ');

            // Consulta principal
            const query = `
                SELECT 
                    e.id_estudiante,
                    e.nombre,
                    e.apellido,
                    e.ci,
                    e.fecha_nacimiento,
                    e.direccion,
                    e.telefono,
                    e.estado_academico,
                    e.fecha_ingreso,
                    e.fecha_creacion,
                    m.nombre AS mencion_nombre,
                    m.id_mencion,
                    u.correo,
                    u.activo AS usuario_activo
                FROM estudiantes e
                LEFT JOIN menciones m ON e.id_mencion = m.id_mencion
                LEFT JOIN usuarios u ON e.id_usuario = u.id_usuario
                WHERE ${whereClause}
                ORDER BY e.${sortField} ${order}
                LIMIT ? OFFSET ?
            `;

            // Añadir paginación al final
            const finalParams = [...queryParams, limitNum, offset];

            // Consulta para contar total
            const countQuery = `
                SELECT COUNT(*) AS total
                FROM estudiantes e
                LEFT JOIN menciones m ON e.id_mencion = m.id_mencion
                LEFT JOIN usuarios u ON e.id_usuario = u.id_usuario
                WHERE ${whereClause}
            `;

            const [estudiantes, countResult] = await Promise.all([
                executeQuery(query, finalParams),
                executeQuery(countQuery, queryParams)
            ]);

            const total = countResult[0].total;
            const totalPages = Math.ceil(total / limitNum);

            res.json({
                success: true,
                data: estudiantes,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages,
                    hasNext: pageNum < totalPages,
                    hasPrev: pageNum > 1
                }
            });

        } catch (error) {
            console.error('❌ Error en listarEstudiantes:', error);
            res.status(500).json({
                success: false,
                message: 'Error al listar estudiantes',
                error: error.message
            });
        }
    }



    /**
     * Obtener estudiante por ID
     */
    async obtenerEstudiante(req, res, next) {
        try {
            const { id } = req.params;

            const query = `
                SELECT 
                    e.*,
                    m.nombre as mencion_nombre,
                    u.correo,
                    u.activo as usuario_activo,
                    u.ultimo_acceso
                FROM estudiantes e
                LEFT JOIN menciones m ON e.id_mencion = m.id_mencion
                LEFT JOIN usuarios u ON e.id_usuario = u.id_usuario
                WHERE e.id_estudiante = ?
            `;

            const estudiantes = await executeQuery(query, [id]);

            if (estudiantes.length === 0) {
                throw createError('Estudiante no encontrado', 404);
            }

            // Obtener historial académico
            const historialQuery = `
                SELECT * FROM historial_academico 
                WHERE id_estudiante = ? 
                ORDER BY gestion DESC
            `;

            const historial = await executeQuery(historialQuery, [id]);

            res.json({
                success: true,
                data: {
                    ...estudiantes[0],
                    historial_academico: historial
                }
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Crear nuevo estudiante
     */
    async crearEstudiante(req, res, next) {
        try {
            const {
                nombre,
                apellido,
                ci,
                fecha_nacimiento,
                direccion,
                telefono,
                correo,
                password,
                id_mencion
            } = req.body;

            // Verificar que el CI no exista
            const ciExistente = await executeQuery(
                'SELECT id_estudiante FROM estudiantes WHERE ci = ?',
                [ci]
            );

            if (ciExistente.length > 0) {
                throw createError('Ya existe un estudiante con ese CI', 409);
            }

            // Verificar que el correo no exista
            const correoExistente = await executeQuery(
                'SELECT id_usuario FROM usuarios WHERE correo = ?',
                [correo]
            );

            if (correoExistente.length > 0) {
                throw createError('Ya existe un usuario con ese correo', 409);
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

            // Asignar rol de estudiante
            const rolEstudianteQuery = `
                INSERT INTO usuario_roles (id_usuario, id_rol)
                SELECT ?, id_rol FROM roles WHERE nombre = 'estudiante'
            `;

            await executeQuery(rolEstudianteQuery, [idUsuario]);

            // Crear estudiante
            const estudianteQuery = `
                INSERT INTO estudiantes (
                    nombre, apellido, ci, fecha_nacimiento, direccion,
                    telefono, id_usuario, id_mencion, estado_academico
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'activo')
            `;

            const estudianteResult = await executeQuery(estudianteQuery, [
                nombre, apellido, ci, fecha_nacimiento, direccion,
                telefono, idUsuario, id_mencion
            ]);

            // Auditar acción
            await auditAction(req, 'estudiantes', 'INSERT', estudianteResult.insertId, null, {
                nombre, apellido, ci, correo, id_mencion
            });

            res.status(201).json({
                success: true,
                message: 'Estudiante creado exitosamente',
                data: {
                    id_estudiante: estudianteResult.insertId,
                    id_usuario: idUsuario,
                    nombre,
                    apellido,
                    ci,
                    correo
                }
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Actualizar estudiante
     */
    async actualizarEstudiante(req, res, next) {
        try {
            const { id } = req.params;
            const {
                nombre,
                apellido,
                fecha_nacimiento,
                direccion,
                telefono,
                id_mencion,
                estado_academico,
                password
            } = req.body;

            // Verificar que el estudiante existe
            const estudianteExistente = await executeQuery(
                'SELECT * FROM estudiantes WHERE id_estudiante = ?',
                [id]
            );

            if (estudianteExistente.length === 0) {
                throw createError('Estudiante no encontrado', 404);
            }

            const datosAnteriores = estudianteExistente[0];

            // Actualizar password si se proporciona
            if (password) {
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(password, saltRounds);
                await executeQuery(
                    'UPDATE usuarios SET password = ? WHERE id_usuario = ?',
                    [hashedPassword, datosAnteriores.id_usuario]
                );
            }

            // Actualizar estudiante
            const query = `
                UPDATE estudiantes SET
                    nombre = ?,
                    apellido = ?,
                    fecha_nacimiento = ?,
                    direccion = ?,
                    telefono = ?,
                    id_mencion = ?,
                    estado_academico = ?,
                    fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id_estudiante = ?
            `;

            await executeQuery(query, [
                nombre, apellido, fecha_nacimiento, direccion,
                telefono, id_mencion, estado_academico, id
            ]);

            // Auditar acción
            await auditAction(req, 'estudiantes', 'UPDATE', id, datosAnteriores, {
                nombre, apellido, fecha_nacimiento, direccion,
                telefono, id_mencion, estado_academico
            });

            res.json({
                success: true,
                message: 'Estudiante actualizado exitosamente',
                data: {
                    id_estudiante: parseInt(id),
                    nombre,
                    apellido,
                    estado_academico
                }
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Eliminar estudiante (soft delete)
     */
    async eliminarEstudiante(req, res, next) {
        try {
            const { id } = req.params;

            // Verificar que el estudiante existe
            const estudianteExistente = await executeQuery(
                'SELECT * FROM estudiantes WHERE id_estudiante = ?',
                [id]
            );

            if (estudianteExistente.length === 0) {
                throw createError('Estudiante no encontrado', 404);
            }

            // Cambiar estado a inactivo en lugar de eliminar
            const query = `
                UPDATE estudiantes SET
                    estado_academico = 'inactivo',
                    fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id_estudiante = ?
            `;

            await executeQuery(query, [id]);

            // También desactivar usuario
            const usuarioQuery = `
                UPDATE usuarios SET activo = FALSE
                WHERE id_usuario = ?
            `;

            await executeQuery(usuarioQuery, [estudianteExistente[0].id_usuario]);

            // Auditar acción
            await auditAction(req, 'estudiantes', 'UPDATE', id, estudianteExistente[0], {
                estado_academico: 'inactivo'
            });

            res.json({
                success: true,
                message: 'Estudiante desactivado exitosamente'
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtener estadísticas de estudiantes
     */
    async obtenerEstadisticas(req, res, next) {
        try {
            const estadisticasQuery = `
                SELECT 
                    COUNT(*) as total_estudiantes,
                    COUNT(CASE WHEN estado_academico = 'activo' THEN 1 END) as activos,
                    COUNT(CASE WHEN estado_academico = 'inactivo' THEN 1 END) as inactivos,
                    COUNT(CASE WHEN estado_academico = 'graduado' THEN 1 END) as graduados,
                    COUNT(CASE WHEN estado_academico = 'suspendido' THEN 1 END) as suspendidos
                FROM estudiantes
            `;

            const porMencionQuery = `
                SELECT 
                    m.nombre as mencion,
                    COUNT(e.id_estudiante) as cantidad
                FROM menciones m
                LEFT JOIN estudiantes e ON m.id_mencion = e.id_mencion
                WHERE m.activo = TRUE
                GROUP BY m.id_mencion, m.nombre
                ORDER BY cantidad DESC
            `;

            const [estadisticas, porMencion] = await Promise.all([
                executeQuery(estadisticasQuery),
                executeQuery(porMencionQuery)
            ]);

            res.json({
                success: true,
                data: {
                    resumen: estadisticas[0],
                    por_mencion: porMencion
                }
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtener historial académico de un estudiante
     */
    async obtenerHistorialAcademico(req, res, next) {
        try {
            const { id } = req.params;

            // Verificar que el estudiante existe
            const estudianteExistente = await executeQuery(
                'SELECT id_estudiante FROM estudiantes WHERE id_estudiante = ?',
                [id]
            );

            if (estudianteExistente.length === 0) {
                throw createError('Estudiante no encontrado', 404);
            }

            const historialQuery = `
                SELECT 
                    h.*,
                    CASE 
                        WHEN h.promedio >= 70 THEN 'Excelente'
                        WHEN h.promedio >= 60 THEN 'Bueno'
                        WHEN h.promedio >= 51 THEN 'Regular'
                        ELSE 'Deficiente'
                    END as rendimiento
                FROM historial_academico h
                WHERE h.id_estudiante = ?
                ORDER BY h.gestion DESC
            `;

            const historial = await executeQuery(historialQuery, [id]);

            res.json({
                success: true,
                data: historial
            });

        } catch (error) {
            next(error);
        }
    }

    // Controlador corregido para obtener notas con tipos de evaluación
    async obtenerNotasPorEstudiante(req, res, next) {
        try {
            const { id } = req.params;
            const query = `
            SELECT 
                n.*,
                m.nombre as materia_nombre,
                m.sigla as materia_sigla,
                i.gestion,
                i.periodo,
                i.id_inscripcion,
                te.nombre as tipo_evaluacion_nombre,
                te.porcentaje as tipo_evaluacion_porcentaje
            FROM notas n
            JOIN inscripciones i ON n.id_inscripcion = i.id_inscripcion
            JOIN materias m ON i.id_materia = m.id_materia
            JOIN tipos_evaluacion te ON n.id_tipo_evaluacion = te.id_tipo_evaluacion
            WHERE i.id_estudiante = ?
            ORDER BY i.gestion DESC, i.periodo DESC, n.fecha_registro DESC
        `;
            const notas = await executeQuery(query, [id]);

            // Procesar las notas para calcular promedios ponderados por materia
            const notasConPromedios = this.calcularPromediosPonderados(notas);

            res.json({ success: true, data: notasConPromedios });
        } catch (error) {
            next(error);
        }
    }

    // Método auxiliar para calcular promedios ponderados
    calcularPromediosPonderados(notas) {
        // Agrupar notas por inscripción (materia-gestión-periodo)
        const notasAgrupadas = {};

        notas.forEach(nota => {
            const key = `${nota.id_inscripcion}`;
            if (!notasAgrupadas[key]) {
                notasAgrupadas[key] = {
                    id_inscripcion: nota.id_inscripcion,
                    materia_nombre: nota.materia_nombre,
                    materia_sigla: nota.materia_sigla,
                    gestion: nota.gestion,
                    periodo: nota.periodo,
                    notas: [],
                    promedio_ponderado: 0,
                    porcentaje_total: 0
                };
            }
            notasAgrupadas[key].notas.push(nota);
        });

        // Calcular promedio ponderado para cada materia
        Object.keys(notasAgrupadas).forEach(key => {
            const materia = notasAgrupadas[key];
            let sumaCalificacionesPonderadas = 0;
            let sumaPorcentajes = 0;

            materia.notas.forEach(nota => {
                const porcentaje = parseFloat(nota.tipo_evaluacion_porcentaje) || 0;
                const calificacion = parseFloat(nota.calificacion) || 0;

                // Calcular la nota real basada en el porcentaje
                const notaReal = (calificacion * porcentaje) / 100;
                sumaCalificacionesPonderadas += notaReal;
                sumaPorcentajes += porcentaje;
            });

            materia.promedio_ponderado = sumaCalificacionesPonderadas;
            materia.porcentaje_total = sumaPorcentajes;

            // Si no se ha completado el 100% de evaluaciones, mostrar el promedio parcial
            if (sumaPorcentajes > 0) {
                materia.promedio_parcial = (sumaCalificacionesPonderadas / sumaPorcentajes) * 100;
            } else {
                materia.promedio_parcial = 0;
            }
        });

        // Convertir de vuelta a array plano para mantener compatibilidad
        const notasConPromedios = [];
        Object.values(notasAgrupadas).forEach(materia => {
            materia.notas.forEach(nota => {
                notasConPromedios.push({
                    ...nota,
                    promedio_materia_ponderado: materia.promedio_ponderado.toFixed(2),
                    promedio_materia_parcial: materia.promedio_parcial.toFixed(2),
                    porcentaje_completado: materia.porcentaje_total
                });
            });
        });

        return notasConPromedios;
    }
}

const controller = new EstudianteController();

module.exports = {
    listarEstudiantes: controller.listarEstudiantes.bind(controller),
    obtenerEstudiante: controller.obtenerEstudiante.bind(controller),
    crearEstudiante: controller.crearEstudiante.bind(controller),
    actualizarEstudiante: controller.actualizarEstudiante.bind(controller),
    eliminarEstudiante: controller.eliminarEstudiante.bind(controller),
    obtenerEstadisticas: controller.obtenerEstadisticas.bind(controller),
    obtenerHistorialAcademico: controller.obtenerHistorialAcademico.bind(controller),
    obtenerNotasPorEstudiante: controller.obtenerNotasPorEstudiante.bind(controller),
    // Funciones adicionales que faltan en las rutas
    obtenerInscripcionesPorEstudiante: async (req, res, next) => {
        try {
            const { id } = req.params;
            const query = `
                SELECT 
                    i.*,
                    m.nombre as materia_nombre,
                    m.sigla as materia_sigla
                FROM inscripciones i
                JOIN materias m ON i.id_materia = m.id_materia
                WHERE i.id_estudiante = ?
                ORDER BY i.gestion DESC, m.semestre
            `;
            const inscripciones = await executeQuery(query, [id]);
            res.json({ success: true, data: inscripciones });
        } catch (error) {
            next(error);
        }
    },

    obtenerEstudiantesPorMencion: async (req, res, next) => {
        try {
            const { id_mencion } = req.params;
            const query = `
                SELECT 
                    e.*,
                    u.correo
                FROM estudiantes e
                JOIN usuarios u ON e.id_usuario = u.id_usuario
                WHERE e.id_mencion = ? AND e.estado_academico = 'activo'
                ORDER BY e.apellido, e.nombre
            `;
            const estudiantes = await executeQuery(query, [id_mencion]);
            res.json({ success: true, data: estudiantes });
        } catch (error) {
            next(error);
        }
    },
    importarEstudiantes: async (req, res, next) => {
        try {
            res.json({
                success: false,
                message: 'Funcionalidad de importación no implementada aún'
            });
        } catch (error) {
            next(error);
        }
    },
    cambiarEstadoAcademico: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { estado } = req.body;

            const query = `
                UPDATE estudiantes 
                SET estado_academico = ?, fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id_estudiante = ?
            `;

            await executeQuery(query, [estado, id]);
            res.json({
                success: true,
                message: 'Estado académico actualizado exitosamente'
            });
        } catch (error) {
            next(error);
        }
    }
};
