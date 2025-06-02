const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const auditoriaController = require('../controllers/auditoriaController');

/**
 * Rutas para gestión de auditoría
 * Todas las rutas requieren autenticación de administrador
 */

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);
router.use(requireRole(['administrador']));

// Ruta para exportar logs
router.get('/exportar', auditoriaController.exportarLogs);

/**
 * @route GET /api/auditoria/logs
 * @desc Obtener logs de auditoría con filtros
 * @access Administrador
 */
router.get('/logs', auditoriaController.getLogs);

/**
 * @route GET /api/auditoria/estadisticas
 * @desc Obtener estadísticas de auditoría
 * @access Administrador
 */
router.get('/estadisticas', auditoriaController.getEstadisticas);

/**
 * @route DELETE /api/auditoria/limpiar
 * @desc Limpiar logs antiguos de auditoría
 * @access Administrador
 */
router.delete('/limpiar', auditoriaController.limpiarLogs);

module.exports = router;
