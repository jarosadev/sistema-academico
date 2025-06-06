const { executeQuery } = require('../config/database');
const { createError } = require('../middleware/errorHandler');
const { auditAction } = require('../middleware/audit-complete');

/**
 * Controlador para gestión de prerrequisitos
 */
class PrerequisitoController {
    /**
     * Obtener prerrequisitos de una materia
     */
    async obtenerPrerequisitos(req, res, next) {
        try {
            const { id_materia } = req.params;

            const query = `
                SELECT 
                    mp.id_materia_prerequisito,
                    m.nombre,
                    m.sigla,
                    m.semestre,
                    mp.obligatorio,
                    men.nombre as mencion_nombre
                FROM materias_prerequisitos mp
                INNER JOIN materias m ON mp.id_materia_prerequisito = m.id_materia
                INNER JOIN menciones men ON m.id_mencion = men.id_mencion
                WHERE mp.id_materia = ?
                ORDER BY m.semestre, m.nombre
            `;

            const prerequisitos = await executeQuery(query, [id_materia]);

            res.json({
                success: true,
                data: prerequisitos
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Agregar prerrequisito a una materia
     */
    async agregarPrerequisito(req, res, next) {
        try {
            const { id_materia } = req.params;
            const { id_materia_prerequisito, obligatorio = true } = req.body;

            // Validar que no sea la misma materia
            if (parseInt(id_materia) === parseInt(id_materia_prerequisito)) {
                throw createError('Una materia no puede ser su propio prerrequisito', 400);
            }

            // Verificar que ambas materias existen
            const [materia, prerequisito] = await Promise.all([
                executeQuery('SELECT * FROM materias WHERE id_materia = ?', [id_materia]),
                executeQuery('SELECT * FROM materias WHERE id_materia = ?', [id_materia_prerequisito])
            ]);

            if (materia.length === 0 || prerequisito.length === 0) {
                throw createError('Una o ambas materias no existen', 404);
            }

            // Verificar que el prerrequisito sea de un semestre anterior
            if (prerequisito[0].semestre >= materia[0].semestre) {
                throw createError('El prerrequisito debe ser de un semestre anterior', 400);
            }

            // Verificar que no exista ya
            const existe = await executeQuery(
                'SELECT * FROM materias_prerequisitos WHERE id_materia = ? AND id_materia_prerequisito = ?',
                [id_materia, id_materia_prerequisito]
            );

            if (existe.length > 0) {
                throw createError('Este prerrequisito ya existe', 409);
            }

            // Insertar prerrequisito
            await executeQuery(
                'INSERT INTO materias_prerequisitos (id_materia, id_materia_prerequisito, obligatorio) VALUES (?, ?, ?)',
                [id_materia, id_materia_prerequisito, obligatorio]
            );

            // Auditar acción
            await auditAction(req, 'materias_prerequisitos', 'INSERT', null, null, {
                id_materia,
                id_materia_prerequisito,
                obligatorio
            });

            res.status(201).json({
                success: true,
                message: 'Prerrequisito agregado exitosamente'
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Eliminar prerrequisito
     */
    async eliminarPrerequisito(req, res, next) {
        try {
            const { id_materia, id_prerequisito } = req.params;

            const existe = await executeQuery(
                'SELECT * FROM materias_prerequisitos WHERE id_materia = ? AND id_materia_prerequisito = ?',
                [id_materia, id_prerequisito]
            );

            if (existe.length === 0) {
                throw createError('Prerrequisito no encontrado', 404);
            }

            await executeQuery(
                'DELETE FROM materias_prerequisitos WHERE id_materia = ? AND id_materia_prerequisito = ?',
                [id_materia, id_prerequisito]
            );

            // Auditar acción
            await auditAction(req, 'materias_prerequisitos', 'DELETE', existe[0], null, null);

            res.json({
                success: true,
                message: 'Prerrequisito eliminado exitosamente'
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Verificar si un estudiante cumple prerrequisitos para una materia
     */
    async verificarPrerequisitosEstudiante(req, res, next) {
        try {
            const { id_estudiante, id_materia } = req.params;

            // Obtener todos los prerrequisitos de la materia
            const prerequisitosQuery = `
                SELECT 
                    mp.id_materia_prerequisito,
                    m.nombre,
                    m.sigla,
                    mp.obligatorio,
                    CASE 
                        WHEN i.estado = 'aprobado' THEN TRUE
                        ELSE FALSE
                    END as cumplido,
                    i.estado as estado_cursado,
                    i.gestion as gestion_cursado
                FROM materias_prerequisitos mp
                INNER JOIN materias m ON mp.id_materia_prerequisito = m.id_materia
                LEFT JOIN inscripciones i ON m.id_materia = i.id_materia 
                    AND i.id_estudiante = ?
                    AND i.estado IN ('aprobado', 'reprobado', 'inscrito')
                WHERE mp.id_materia = ?
                ORDER BY mp.obligatorio DESC, m.semestre, m.nombre
            `;

            const prerequisitos = await executeQuery(prerequisitosQuery, [id_estudiante, id_materia]);

            // Verificar si cumple todos los obligatorios
            const obligatoriosCumplidos = prerequisitos
                .filter(p => p.obligatorio)
                .every(p => p.cumplido);

            const resumen = {
                puede_inscribirse: obligatoriosCumplidos || prerequisitos.length === 0,
                total_prerequisitos: prerequisitos.length,
                obligatorios_cumplidos: prerequisitos.filter(p => p.obligatorio && p.cumplido).length,
                total_obligatorios: prerequisitos.filter(p => p.obligatorio).length,
                prerequisitos: prerequisitos
            };

            res.json({
                success: true,
                data: resumen
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtener materias disponibles para un estudiante
     */
    async obtenerMateriasDisponibles(req, res, next) {
        try {
            const { id_estudiante } = req.params;
            const { gestion, periodo } = req.query;

            if (!gestion || !periodo) {
                throw createError('Gestión y periodo son requeridos', 400);
            }

            // Obtener información del estudiante
            const estudiante = await executeQuery(
                'SELECT * FROM estudiantes WHERE id_estudiante = ?',
                [id_estudiante]
            );

            if (estudiante.length === 0) {
                throw createError('Estudiante no encontrado', 404);
            }

            // Query compleja para obtener materias con estado de disponibilidad
            const query = `
                SELECT DISTINCT
                    m.id_materia,
                    m.nombre,
                    m.sigla,
                    m.semestre,
                    men.nombre as mencion_nombre,
                    -- Verificar si ya está inscrito
                    CASE 
                        WHEN i_actual.id_inscripcion IS NOT NULL THEN TRUE
                        ELSE FALSE
                    END as ya_inscrito,
                    i_actual.estado as estado_inscripcion,
                    -- Contar prerrequisitos
                    COUNT(DISTINCT mp.id_materia_prerequisito) as total_prerequisitos,
                    COUNT(DISTINCT CASE 
                        WHEN mp.obligatorio = TRUE AND i_pre.estado = 'aprobado' 
                        THEN mp.id_materia_prerequisito 
                    END) as prerequisitos_cumplidos,
                    -- Determinar disponibilidad
                    CASE 
                        WHEN i_actual.id_inscripcion IS NOT NULL THEN 'Ya inscrito'
                        WHEN COUNT(DISTINCT mp.id_materia_prerequisito) = 0 THEN 'Disponible'
                        WHEN COUNT(DISTINCT CASE 
                            WHEN mp.obligatorio = TRUE AND i_pre.estado = 'aprobado' 
                            THEN mp.id_materia_prerequisito 
                        END) >= COUNT(DISTINCT CASE 
                            WHEN mp.obligatorio = TRUE 
                            THEN mp.id_materia_prerequisito 
                        END) THEN 'Disponible'
                        ELSE 'Falta prerequisitos'
                    END as estado_disponibilidad
                FROM materias m
                INNER JOIN menciones men ON m.id_mencion = men.id_mencion
                -- Verificar inscripción actual
                LEFT JOIN inscripciones i_actual ON m.id_materia = i_actual.id_materia 
                    AND i_actual.id_estudiante = ?
                    AND i_actual.gestion = ?
                    AND i_actual.periodo = ?
                -- Verificar prerrequisitos
                LEFT JOIN materias_prerequisitos mp ON m.id_materia = mp.id_materia
                LEFT JOIN inscripciones i_pre ON mp.id_materia_prerequisito = i_pre.id_materia
                    AND i_pre.id_estudiante = ?
                WHERE m.activo = TRUE
                    AND m.id_mencion = ?
                GROUP BY m.id_materia
                ORDER BY m.semestre, m.nombre
            `;

            const materias = await executeQuery(query, [
                id_estudiante, gestion, periodo,
                id_estudiante,
                estudiante[0].id_mencion
            ]);

            res.json({
                success: true,
                data: materias
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtener árbol de prerrequisitos de una materia
     */
    async obtenerArbolPrerequisitos(req, res, next) {
        try {
            const { id_materia } = req.params;

            // Función recursiva para construir el árbol
            const construirArbol = async (idMateria, visitados = new Set()) => {
                if (visitados.has(idMateria)) {
                    return null; // Evitar ciclos
                }
                visitados.add(idMateria);

                const materiaQuery = `
                    SELECT m.*, men.nombre as mencion_nombre
                    FROM materias m
                    INNER JOIN menciones men ON m.id_mencion = men.id_mencion
                    WHERE m.id_materia = ?
                `;
                const materia = await executeQuery(materiaQuery, [idMateria]);

                if (materia.length === 0) {
                    return null;
                }

                const prerequisitosQuery = `
                    SELECT mp.*, m.nombre, m.sigla, m.semestre
                    FROM materias_prerequisitos mp
                    INNER JOIN materias m ON mp.id_materia_prerequisito = m.id_materia
                    WHERE mp.id_materia = ?
                `;
                const prerequisitos = await executeQuery(prerequisitosQuery, [idMateria]);

                const nodo = {
                    ...materia[0],
                    prerequisitos: []
                };

                for (const pre of prerequisitos) {
                    const subarbol = await construirArbol(pre.id_materia_prerequisito, new Set(visitados));
                    if (subarbol) {
                        nodo.prerequisitos.push({
                            obligatorio: pre.obligatorio,
                            materia: subarbol
                        });
                    }
                }

                return nodo;
            };

            const arbol = await construirArbol(id_materia);

            res.json({
                success: true,
                data: arbol
            });

        } catch (error) {
            next(error);
        }
    }
}

const controller = new PrerequisitoController();

module.exports = {
    obtenerPrerequisitos: controller.obtenerPrerequisitos.bind(controller),
    agregarPrerequisito: controller.agregarPrerequisito.bind(controller),
    eliminarPrerequisito: controller.eliminarPrerequisito.bind(controller),
    verificarPrerequisitosEstudiante: controller.verificarPrerequisitosEstudiante.bind(controller),
    obtenerMateriasDisponibles: controller.obtenerMateriasDisponibles.bind(controller),
    obtenerArbolPrerequisitos: controller.obtenerArbolPrerequisitos.bind(controller)
};
