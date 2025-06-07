const { executeQuery } = require('../config/database');
const { createError } = require('../middleware/errorHandler');
const { HTTP_STATUS } = require('../config/constants');

/**
 * Controlador para gestión de tipos de evaluación
 */
class TipoEvaluacionController {
    /**
     * Obtener tipos de evaluación por materia
     */
    async obtenerPorMateria(req, res, next) {
        try {
            const { id_materia } = req.params;
            
            // Verificar que la materia existe
            const materia = await executeQuery(
                'SELECT id_materia FROM materias WHERE id_materia = ?',
                [id_materia]
            );

            if (materia.length === 0) {
                throw createError('Materia no encontrada', 404);
            }

            const query = `
                SELECT 
                    id_tipo_evaluacion,
                    nombre,
                    porcentaje,
                    orden,
                    activo
                FROM tipos_evaluacion
                WHERE id_materia = ?
                ORDER BY orden ASC
            `;

            const tipos = await executeQuery(query, [id_materia]);

            res.json({
                success: true,
                data: tipos
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Crear nuevo tipo de evaluación
     */
    async crear(req, res, next) {
        try {
            const { id_materia } = req.params;
            const { nombre, porcentaje, orden } = req.body;

            // Validar que la suma de porcentajes no exceda 100%
            const porcentajesActuales = await executeQuery(
                'SELECT SUM(porcentaje) as total FROM tipos_evaluacion WHERE id_materia = ? AND activo = 1',
                [id_materia]
            );

            const totalActual = porcentajesActuales[0].total || 0;
            if (totalActual + parseFloat(porcentaje) > 100) {
                throw createError('La suma de porcentajes no puede exceder el 100%', 400);
            }

            const query = `
                INSERT INTO tipos_evaluacion (id_materia, nombre, porcentaje, orden)
                VALUES (?, ?, ?, ?)
            `;

            const result = await executeQuery(query, [
                id_materia,
                nombre,
                porcentaje,
                orden
            ]);

            const nuevoTipo = await executeQuery(
                'SELECT * FROM tipos_evaluacion WHERE id_tipo_evaluacion = ?',
                [result.insertId]
            );

            res.status(201).json({
                success: true,
                message: 'Tipo de evaluación creado exitosamente',
                data: nuevoTipo[0]
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Actualizar tipo de evaluación
     */
    async actualizar(req, res, next) {
        try {
            const { id_materia, id_tipo_evaluacion } = req.params;
            const { nombre, porcentaje, orden, activo } = req.body;

            console.log(id_materia, id_tipo_evaluacion, nombre, porcentaje, orden, activo);

            // Verificar que existe
            const tipoExistente = await executeQuery(
                'SELECT * FROM tipos_evaluacion WHERE id_tipo_evaluacion = ? AND id_materia = ?',
                [id_tipo_evaluacion, id_materia]
            );

            if (tipoExistente.length === 0) {
                throw createError('Tipo de evaluación no encontrado', 404);
            }

                // Validar porcentaje total si se está actualizando el porcentaje
                if (porcentaje !== undefined) {
                    const porcentajesActuales = await executeQuery(
                        'SELECT SUM(porcentaje) as total FROM tipos_evaluacion WHERE id_materia = ? AND id_tipo_evaluacion != ? AND activo = 1',
                        [id_materia, id_tipo_evaluacion]
                    );

                const totalActual = porcentajesActuales[0].total || 0;
                if (totalActual + parseFloat(porcentaje) > 100) {
                    throw createError('La suma de porcentajes no puede exceder el 100%', 400);
                }
            }

            const updates = [];
            const params = [];

            if (nombre !== undefined) {
                updates.push('nombre = ?');
                params.push(nombre);
            }
            if (porcentaje !== undefined) {
                updates.push('porcentaje = ?');
                params.push(porcentaje);
            }
            if (orden !== undefined) {
                updates.push('orden = ?');
                params.push(orden);
            }
            if (activo !== undefined) {
                updates.push('activo = ?');
                params.push(activo);
            }

            if (updates.length === 0) {
                throw createError('No hay campos para actualizar', 400);
            }

            params.push(id_tipo_evaluacion, id_materia);
            const query = `
                UPDATE tipos_evaluacion 
                SET ${updates.join(', ')} 
                WHERE id_tipo_evaluacion = ? AND id_materia = ?
            `;

            await executeQuery(query, params);

            const tipoActualizado = await executeQuery(
                'SELECT * FROM tipos_evaluacion WHERE id_tipo_evaluacion = ?',
                [id_tipo_evaluacion]
            );

            res.json({
                success: true,
                message: 'Tipo de evaluación actualizado exitosamente',
                data: tipoActualizado[0]
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Eliminar tipo de evaluación (soft delete)
     */
    async eliminar(req, res, next) {
        try {
            const { id_materia, id_tipo_evaluacion } = req.params;

            // Verificar que existe
            const tipoExistente = await executeQuery(
                'SELECT * FROM tipos_evaluacion WHERE id_tipo_evaluacion = ? AND id_materia = ?',
                [id_tipo_evaluacion, id_materia]
            );

            if (tipoExistente.length === 0) {
                throw createError('Tipo de evaluación no encontrado', 404);
            }

            // Verificar si hay notas asociadas
            const notasAsociadas = await executeQuery(
                'SELECT COUNT(*) as count FROM notas WHERE id_tipo_evaluacion = ?',
                [id_tipo_evaluacion]
            );

            if (notasAsociadas[0].count > 0) {
                // Soft delete
                await executeQuery(
                    'UPDATE tipos_evaluacion SET activo = 0 WHERE id_tipo_evaluacion = ?',
                    [id_tipo_evaluacion]
                );
            } else {
                // Hard delete si no hay notas asociadas
                await executeQuery(
                    'DELETE FROM tipos_evaluacion WHERE id_tipo_evaluacion = ?',
                    [id_tipo_evaluacion]
                );
            }

            res.json({
                success: true,
                message: 'Tipo de evaluación eliminado exitosamente'
            });

        } catch (error) {
            next(error);
        }
    }
}

const controller = new TipoEvaluacionController();

module.exports = {
    obtenerPorMateria: controller.obtenerPorMateria.bind(controller),
    crear: controller.crear.bind(controller),
    actualizar: controller.actualizar.bind(controller),
    eliminar: controller.eliminar.bind(controller)
};
