const express = require('express');
const router = express.Router();
const notaController = require('../controllers/notaController');
const { authenticateToken, requireRole } = require('../middleware/auth');

/**
 * Rutas para gestión de notas
 * Todas las rutas requieren autenticación
 */

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

/**
 * @route GET /api/notas
 * @desc Listar notas con paginación y filtros
 * @access Administrador, Docente
 */
router.get('/', 
    requireRole(['administrador', 'docente']), 
    notaController.listarNotas
);

/**
 * @route GET /api/notas/estadisticas
 * @desc Obtener estadísticas de notas
 * @access Administrador, Docente
 */
router.get('/estadisticas', 
    requireRole(['administrador', 'docente']), 
    notaController.obtenerEstadisticas
);

/**
 * @route GET /api/notas/:id
 * @desc Obtener nota por ID
 * @access Administrador, Docente, Estudiante (solo sus propias notas)
 */
router.get('/:id', 
    requireRole(['administrador', 'docente', 'estudiante']), 
    notaController.obtenerNota
);

/**
 * @route POST /api/notas
 * @desc Registrar nueva nota
 * @access Administrador, Docente
 */
router.post('/', 
    requireRole(['administrador', 'docente']), 
    notaController.registrarNota
);

/**
 * @route POST /api/notas/masivo
 * @desc Registro masivo de notas
 * @access Administrador, Docente
 */
router.post('/masivo', 
    requireRole(['administrador', 'docente']), 
    notaController.registroMasivo
);

/**
 * @route PUT /api/notas/:id
 * @desc Actualizar nota existente
 * @access Administrador, Docente (solo sus propias notas)
 */
router.put('/:id', 
    requireRole(['administrador', 'docente']), 
    notaController.actualizarNota
);

/**
 * @route DELETE /api/notas/:id
 * @desc Eliminar nota
 * @access Administrador, Docente (solo sus propias notas)
 */
router.delete('/:id', 
    requireRole(['administrador', 'docente']), 
    notaController.eliminarNota
);

/**
 * @route GET /api/notas/inscripcion/:id_inscripcion
 * @desc Obtener notas de una inscripción
 * @access Administrador, Docente, Estudiante (solo sus propias notas)
 */
router.get('/inscripcion/:id_inscripcion', 
    requireRole(['administrador', 'docente', 'estudiante']), 
    notaController.obtenerNotasPorInscripcion
);

/**
 * @route GET /api/notas/materia/:id_materia
 * @desc Obtener notas por materia
 * @access Administrador, Docente
 */
router.get('/materia/:id_materia',
    requireRole(['administrador', 'docente']),
    notaController.obtenerNotasPorMateria
);

module.exports = router;
