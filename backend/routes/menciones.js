const express = require('express');
const router = express.Router();
const {
    createMencion,
    getMenciones,
    getMencionById,
    updateMencion,
    deleteMencion,
    getMencionStats,
    getMencionesEstadisticas
} = require('../controllers/mencionController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validate, mentionSchemas, idParamSchema, paginationSchema, validateQuery, validateParams } = require('../middleware/validation');
const { captureOriginalData } = require('../middleware/audit-complete');

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Rutas públicas (solo lectura para usuarios autenticados)
router.get('/', getMenciones);
router.get('/estadisticas', getMencionesEstadisticas);
router.get('/:id', getMencionById);
router.get('/:id/stats', getMencionStats);

// Rutas que requieren permisos de administrador
router.post('/', 
    requireRole('administrador'),
    validate(mentionSchemas.create),
    createMencion
);

router.put('/:id', 
    requireRole('administrador'),
    validateParams(idParamSchema),
    captureOriginalData('menciones', 'id_mencion'),
    validate(mentionSchemas.update),
    updateMencion
);

router.delete('/:id', 
    requireRole('administrador'),
    validateParams(idParamSchema),
    captureOriginalData('menciones', 'id_mencion'),
    deleteMencion
);

module.exports = router;
