const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
    getLogs,
    getEstadisticas,
    limpiarLogs,
    getActividadReciente,
    getLogsPorUsuario,
    getLogsPorTabla
} = require('../controllers/auditoriaController');

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
router.get('/logs', getLogs);

/**
 * @route GET /api/auditoria/estadisticas
 * @desc Obtener estadísticas de auditoría
 * @access Administrador
 */
router.get('/estadisticas', getEstadisticas);

/**
 * @route GET /api/auditoria/actividad-reciente
 * @desc Obtener actividad reciente del sistema
 * @access Administrador
 */
router.get('/actividad-reciente', getActividadReciente);

/**
 * @route GET /api/auditoria/usuario/:id_usuario
 * @desc Obtener logs por usuario específico
 * @access Administrador
 */
router.get('/usuario/:id_usuario', getLogsPorUsuario);

/**
 * @route GET /api/auditoria/tabla/:tabla
 * @desc Obtener logs por tabla específica
 * @access Administrador
 */
router.get('/tabla/:tabla', getLogsPorTabla);

/**
 * @route DELETE /api/auditoria/limpiar
 * @desc Limpiar logs antiguos de auditoría
 * @access Administrador
 */
router.delete('/limpiar', limpiarLogs);

module.exports = router;
