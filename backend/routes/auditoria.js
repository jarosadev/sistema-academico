const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { obtenerLogsAuditoria, obtenerEstadisticasAuditoria, limpiarLogsAntiguos } = require('../middleware/audit');

/**
 * Rutas para gestión de auditoría
 * Todas las rutas requieren autenticación de administrador
 */

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);
router.use(requireRole(['administrador']));

/**
 * @route GET /api/auditoria/logs
 * @desc Obtener logs de auditoría con filtros
 * @access Administrador
 */
router.get('/logs', async (req, res, next) => {
    try {
        const filtros = {
            id_usuario: req.query.id_usuario,
            tabla: req.query.tabla,
            accion: req.query.accion,
            fecha_inicio: req.query.fecha_inicio,
            fecha_fin: req.query.fecha_fin,
            page: req.query.page || 1,
            limit: req.query.limit || 50
        };

        const resultado = await obtenerLogsAuditoria(filtros);
        res.json(resultado);

    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/auditoria/estadisticas
 * @desc Obtener estadísticas de auditoría
 * @access Administrador
 */
router.get('/estadisticas', async (req, res, next) => {
    try {
        const filtros = {
            fecha_inicio: req.query.fecha_inicio,
            fecha_fin: req.query.fecha_fin
        };

        const resultado = await obtenerEstadisticasAuditoria(filtros);
        res.json(resultado);

    } catch (error) {
        next(error);
    }
});

/**
 * @route DELETE /api/auditoria/limpiar
 * @desc Limpiar logs antiguos de auditoría
 * @access Administrador
 */
router.delete('/limpiar', async (req, res, next) => {
    try {
        const { dias = 90 } = req.query;
        const diasAntiguedad = parseInt(dias);

        if (diasAntiguedad < 30) {
            return res.status(400).json({
                success: false,
                message: 'No se pueden eliminar logs con menos de 30 días de antigüedad'
            });
        }

        const resultado = await limpiarLogsAntiguos(diasAntiguedad);
        res.json(resultado);

    } catch (error) {
        next(error);
    }
});

module.exports = router;
