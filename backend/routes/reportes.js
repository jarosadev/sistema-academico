const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');
const { authenticateToken, requireRole } = require('../middleware/auth');

/**
 * Rutas para generación de reportes
 * Todas las rutas requieren autenticación
 */

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

/**
 * @route GET /api/reportes/general
 * @desc Reporte general del sistema
 * @access Administrador
 */
router.get('/general', 
    requireRole(['administrador']), 
    reporteController.reporteGeneral
);

/**
 * @route GET /api/reportes/estudiante/:id_estudiante
 * @desc Reporte de rendimiento académico por estudiante
 * @access Administrador, Docente, Estudiante (solo su propio reporte)
 */
router.get('/estudiante/:id_estudiante', 
    requireRole(['administrador', 'docente', 'estudiante']), 
    reporteController.reporteRendimientoEstudiante
);

/**
 * @route GET /api/reportes/materia/:id_materia
 * @desc Reporte de materia específica
 * @access Administrador, Docente (solo materias asignadas)
 */
router.get('/materia/:id_materia', 
    requireRole(['administrador', 'docente']), 
    reporteController.reporteMateria
);

/**
 * @route GET /api/reportes/docente/:id_docente
 * @desc Reporte de docente
 * @access Administrador, Docente (solo su propio reporte)
 */
router.get('/docente/:id_docente', 
    requireRole(['administrador', 'docente']), 
    reporteController.reporteDocente
);

/**
 * @route GET /api/reportes/mencion/:id_mencion
 * @desc Reporte de estadísticas por mención
 * @access Administrador
 */
router.get('/mencion/:id_mencion', 
    requireRole(['administrador']), 
    reporteController.reporteMencion
);

/**
 * @route GET /api/reportes/exportar/csv
 * @desc Exportar reporte a CSV
 * @access Administrador, Docente
 */
router.get('/exportar/csv', 
    requireRole(['administrador', 'docente']), 
    reporteController.exportarCSV
);

module.exports = router;
