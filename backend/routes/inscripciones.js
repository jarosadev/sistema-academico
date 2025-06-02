const express = require('express');
const router = express.Router();
const inscripcionController = require('../controllers/inscripcionController');
const { authenticateToken, requireRole } = require('../middleware/auth');

/**
 * Rutas para gestión de inscripciones
 * Todas las rutas requieren autenticación
 */

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

/**
 * @route GET /api/inscripciones
 * @desc Listar inscripciones con paginación y filtros
 * @access Administrador, Docente
 */
router.get('/', 
    requireRole(['administrador', 'docente']), 
    inscripcionController.listarInscripciones
);

/**
 * @route GET /api/inscripciones/estadisticas
 * @desc Obtener estadísticas de inscripciones
 * @access Administrador
 */
router.get('/estadisticas', 
    requireRole(['administrador']), 
    inscripcionController.obtenerEstadisticas
);

/**
 * @route GET /api/inscripciones/:id
 * @desc Obtener inscripción por ID
 * @access Administrador, Docente, Estudiante (solo sus propias inscripciones)
 */
router.get('/:id', 
    requireRole(['administrador', 'docente', 'estudiante']), 
    inscripcionController.obtenerInscripcion
);

/**
 * @route POST /api/inscripciones
 * @desc Crear nueva inscripción
 * @access Administrador, Estudiante (solo para sí mismo)
 */
router.post('/', 
    requireRole(['administrador', 'estudiante']), 
    inscripcionController.crearInscripcion
);

/**
 * @route PUT /api/inscripciones/:id
 * @desc Actualizar inscripción (cambiar estado, paralelo)
 * @access Administrador, Docente
 */
router.put('/:id', 
    requireRole(['administrador', 'docente']), 
    inscripcionController.actualizarInscripcion
);

/**
 * @route DELETE /api/inscripciones/:id
 * @desc Eliminar inscripción
 * @access Administrador
 */
router.delete('/:id', 
    requireRole(['administrador']), 
    inscripcionController.eliminarInscripcion
);

/**
 * @route GET /api/inscripciones/estudiante/:id_estudiante
 * @desc Obtener inscripciones de un estudiante específico
 * @access Administrador, Docente, Estudiante (solo sus propias inscripciones)
 */
router.get('/estudiante/:id_estudiante', 
    requireRole(['administrador', 'docente', 'estudiante']), 
    inscripcionController.obtenerInscripcionesPorEstudiante || ((req, res) => {
        res.json({ success: false, message: 'Función no implementada' });
    })
);

/**
 * @route GET /api/inscripciones/materia/:id_materia
 * @desc Obtener inscripciones de una materia específica
 * @access Administrador, Docente
 */
router.get('/materia/:id_materia',
    requireRole(['administrador', 'docente']),
    inscripcionController.obtenerInscripcionesPorMateria
);

/**
 * @route POST /api/inscripciones/masiva
 * @desc Inscripción masiva de estudiantes
 * @access Administrador
 */
router.post('/masiva', 
    requireRole(['administrador']), 
    inscripcionController.inscripcionMasiva || ((req, res) => {
        res.json({ success: false, message: 'Función no implementada' });
    })
);

/**
 * @route PUT /api/inscripciones/:id/estado
 * @desc Actualizar estado de inscripción
 * @access Administrador, Docente
 */
router.put('/:id/estado',
    requireRole(['administrador', 'docente']),
    inscripcionController.cambiarEstado
);

module.exports = router;
