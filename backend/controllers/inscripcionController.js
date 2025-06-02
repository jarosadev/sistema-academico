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
    async obtenerInscripcion(req, res, next) {
        try {
            const { id } = req.params;

            const query = `
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
                    AND i.gestion = dm.gestion AND i.paralelo = dm.paralelo
                LEFT JOIN docentes d ON dm.id_docente = d.id_docente
                WHERE i.id_inscripcion = ?
            `;

            const inscripciones = await executeQuery(query, [id]);

            if (inscripciones.length === 0) {
                throw createError(404, 'Inscripción no encontrada');
            }

            // Obtener notas de la inscripción
            const notasQuery = `
                SELECT 
                    n.*,
                    d.nombre as docente_nombre,
                    d.apellido as docente_apellido
                FROM notas n
                LEFT JOIN docentes d ON n.id_docente = d.id_docente
                WHERE n.id_inscripcion = ?
                ORDER BY 
                    CASE n.tipo_evaluacion
                        WHEN 'parcial1' THEN 1
                        WHEN 'parcial2' THEN 2
                        WHEN 'final' THEN 3
                        WHEN 'segunda_instancia' THEN 4
                    END
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
                paralelo = 'A'
            } = req.body;

            // Verificar que el estudiante existe y está activo
            const estudianteExistente = await executeQuery(
                'SELECT * FROM estudiantes WHERE id_estudiante = ? AND estado_academico = "activo"',
                [id_estudiante]
            );

            if (estudianteExistente.length === 0) {
                throw createError(404, 'Estudiante no encontrado o inactivo');
            }

            // Verificar que la materia existe y está activa
            const materiaExistente = await executeQuery(
                'SELECT * FROM materias WHERE id_materia = ? AND activo = TRUE',
                [id_materia]
            );

            if (materiaExistente.length === 0) {
                throw createError(404, 'Materia no encontrada o inactiva');
            }

            // Verificar que no esté ya inscrito en la misma materia y gestión
            const inscripcionExistente = await executeQuery(
                'SELECT id_inscripcion FROM inscripciones WHERE id_estudiante = ? AND id_materia = ? AND gestion = ?',
                [id_estudiante, id_materia, gestion]
            );

            if (inscripcionExistente.length > 0) {
                throw createError(409, 'El estudiante ya está inscrito en esta materia para esta gestión');
            }

            // Verificar que la materia pertenece a la mención del estudiante
            const mencionEstudiante = estudianteExistente[0].id_mencion;
            const mencionMateria = materiaExistente[0].id_mencion;

            if (mencionEstudiante !== mencionMateria) {
                throw createError(400, 'La materia no pertenece a la mención del estudiante');
            }

            // Verificar que hay cupo en el paralelo (opcional - se puede configurar límite)
            const cupoQuery = `
                SELECT COUNT(*) as inscritos
                FROM inscripciones 
                WHERE id_materia = ? AND gestion = ? AND paralelo = ?
            `;

            const cupoResult = await executeQuery(cupoQuery, [id_materia, gestion, paralelo]);
            const LIMITE_PARALELO = 30; // Configurable

            if (cupoResult[0].inscritos >= LIMITE_PARALELO) {
                throw createError(400, `El paralelo ${paralelo} está lleno (límite: ${LIMITE_PARALELO} estudiantes)`);
            }

            // Crear inscripción
            const query = `
                INSERT INTO inscripciones (
                    id_estudiante, id_materia, gestion, paralelo, estado
                ) VALUES (?, ?, ?, ?, 'inscrito')
            `;

            const result = await executeQuery(query, [
                id_estudiante, id_materia, gestion, paralelo
            ]);

            // Auditar acción
            await auditAction(req, 'inscripciones', 'INSERT', result.insertId, null, {
                id_estudiante, id_materia, gestion, paralelo
            });

            res.status(201).json({
                success: true,
                message: 'Inscripción creada exitosamente',
                data: {
                    id_inscripcion: result.insertId,
                    id_estudiante: parseInt(id_estudiante),
                    id_materia: parseInt(id_materia),
                    gestion: parseInt(gestion),
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
            const { estado, paralelo } = req.body;

            // Verificar que la inscripción existe
            const inscripcionExistente = await executeQuery(
                'SELECT * FROM inscripciones WHERE id_inscripcion = ?',
                [id]
            );

            if (inscripcionExistente.length === 0) {
                throw createError(404, 'Inscripción no encontrada');
            }

            const datosAnteriores = inscripcionExistente[0];

            // Validar cambio de estado
            const estadosValidos = ['inscrito', 'aprobado', 'reprobado', 'abandonado'];
            if (estado && !estadosValidos.includes(estado)) {
                throw createError(400, 'Estado de inscripción inválido');
            }

            // Si se cambia a aprobado, verificar que tenga nota final
            if (estado === 'aprobado') {
                const notaFinal = await executeQuery(
                    'SELECT calificacion FROM notas WHERE id_inscripcion = ? AND tipo_evaluacion = "final"',
                    [id]
                );

                if (notaFinal.length === 0 || notaFinal[0].calificacion < 51) {
                    throw createError(400, 'No se puede aprobar sin nota final válida (≥51)');
                }
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

            if (updateFields.length === 0) {
                throw createError(400, 'No hay campos para actualizar');
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
                estado, paralelo
            });

            res.json({
                success: true,
                message: 'Inscripción actualizada exitosamente',
                data: {
                    id_inscripcion: parseInt(id),
                    estado: estado || datosAnteriores.estado,
                    paralelo: paralelo || datosAnteriores.paralelo
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
                throw createError(404, 'Inscripción no encontrada');
            }

            // Verificar que no tenga notas registradas
            const notasExistentes = await executeQuery(
                'SELECT COUNT(*) as total FROM notas WHERE id_inscripcion = ?',
                [id]
            );

            if (notasExistentes[0].total > 0) {
                throw createError(400, 'No se puede eliminar una inscripción con notas registradas');
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
                    AVG(CASE WHEN n.tipo_evaluacion = 'final' THEN n.calificacion END) as nota_final
                FROM inscripciones i
                INNER JOIN materias m ON i.id_materia = m.id_materia
                LEFT JOIN menciones men ON m.id_mencion = men.id_mencion
                LEFT JOIN notas n ON i.id_inscripcion = n.id_inscripcion
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
                throw createError(400, 'Se requiere un array de inscripciones');
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
}

const controller = new InscripcionController();

module.exports = {
    listarInscripciones: controller.listarInscripciones.bind(controller),
    obtenerInscripcion: controller.obtenerInscripcion.bind(controller),
    crearInscripcion: controller.crearInscripcion.bind(controller),
    actualizarInscripcion: controller.actualizarInscripcion.bind(controller),
    eliminarInscripcion: controller.eliminarInscripcion.bind(controller),
    obtenerEstadisticas: controller.obtenerEstadisticas.bind(controller),
    obtenerInscripcionesPorMateria: controller.obtenerInscripcionesPorMateria.bind(controller),
    // Funciones adicionales que pueden faltar
    inscripcionMasiva: async (req, res, next) => {
        try {
            res.json({ 
                success: false, 
                message: 'Funcionalidad de inscripción masiva no implementada aún' 
            });
        } catch (error) {
            next(error);
        }
    },
    cambiarEstado: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { estado } = req.body;
            
            const query = `
                UPDATE inscripciones 
                SET estado = ?, fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id_inscripcion = ?
            `;
            
            await executeQuery(query, [estado, id]);
            res.json({ 
                success: true, 
                message: 'Estado de inscripción actualizado exitosamente' 
            });
        } catch (error) {
            next(error);
        }
    }
};
