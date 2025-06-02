const { executeQuery } = require('../config/database');
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
     * Obtener prerequisitos de una materia (funcionalidad futura)
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
}

const controller = new MateriaController();

module.exports = {
    listarMaterias: controller.listarMaterias.bind(controller),
    obtenerMateria: controller.obtenerMateria.bind(controller),
    crearMateria: controller.crearMateria.bind(controller),
    actualizarMateria: controller.actualizarMateria.bind(controller),
    eliminarMateria: controller.eliminarMateria.bind(controller),
    obtenerEstadisticas: controller.obtenerEstadisticas.bind(controller),
    obtenerMateriasPorMencion: controller.obtenerMateriasPorMencion.bind(controller),
    obtenerPrerequisitos: controller.obtenerPrerequisitos.bind(controller),
    obtenerDocentesMateria: async (req, res, next) => {
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
    },
    obtenerInscripcionesMateria: async (req, res, next) => {
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
    },

    obtenerParalelosMateria: async (req, res, next) => {
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
                    COUNT(i.id_inscripcion) as estudiantes_inscritos,
                    d.nombre as docente_nombre,
                    d.apellido as docente_apellido
                FROM docente_materias dm
                LEFT JOIN docentes d ON dm.id_docente = d.id_docente
                LEFT JOIN inscripciones i ON i.id_materia = dm.id_materia 
                    AND i.paralelo = dm.paralelo 
                    AND i.gestion = dm.gestion
                WHERE dm.id_materia = ? 
                    AND dm.gestion = ?
                GROUP BY dm.paralelo, d.id_docente
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
};
