const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const horarioController = require('../controllers/horarioController');

/**
 * Rutas para gestión de horarios
 * Todas las rutas requieren autenticación
 */

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

/**
 * @route GET /api/horarios
 * @desc Listar horarios con filtros
 * @access Todos los usuarios autenticados
 */
router.get('/', 
    horarioController.listarHorarios
);

/**
 * @route GET /api/horarios/:id
 * @desc Obtener horario por ID
 * @access Todos los usuarios autenticados
 */
router.get('/:id', 
    horarioController.obtenerHorario
);

/**
 * @route POST /api/horarios
 * @desc Crear nuevo horario
 * @access Administrador
 */
router.post('/', 
    requireRole(['administrador']), 
    horarioController.crearHorario
);

/**
 * @route PUT /api/horarios/:id
 * @desc Actualizar horario
 * @access Administrador
 */
router.put('/:id', 
    requireRole(['administrador']), 
    horarioController.actualizarHorario
);

/**
 * @route DELETE /api/horarios/:id
 * @desc Eliminar horario
 * @access Administrador
 */
router.delete('/:id', 
    requireRole(['administrador']), 
    horarioController.eliminarHorario
);

/**
 * @route GET /api/horarios/estudiante/:id_estudiante
 * @desc Obtener horario completo de un estudiante
 * @access Administrador, Docente, Estudiante (solo su propio horario)
 */
router.get('/estudiante/:id_estudiante', 
    requireRole(['administrador', 'docente', 'estudiante']), 
    horarioController.obtenerHorarioEstudiante
);

/**
 * @route GET /api/horarios/verificar-conflictos/:id_estudiante/:id_materia
 * @desc Verificar conflictos de horario antes de inscripción
 * @access Administrador, Estudiante (solo su propia verificación)
 */
router.get('/verificar-conflictos/:id_estudiante/:id_materia', 
    requireRole(['administrador', 'estudiante']), 
    horarioController.verificarConflictosInscripcion
);

module.exports = router;
