const express = require('express');
const router = express.Router();
const estudianteController = require('../controllers/estudianteController');
const { authenticateToken, requireRole } = require('../middleware/auth');

/**
 * Rutas para gestión de estudiantes
 * Todas las rutas requieren autenticación
 */

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

/**
 * @route GET /api/estudiantes
 * @desc Listar estudiantes con paginación y filtros
 * @access Administrador, Docente
 */
router.get('/', 
    requireRole(['administrador', 'docente']), 
    estudianteController.listarEstudiantes
);

/**
 * @route GET /api/estudiantes/estadisticas
 * @desc Obtener estadísticas de estudiantes
 * @access Administrador
 */
router.get('/estadisticas', 
    requireRole(['administrador']), 
    estudianteController.obtenerEstadisticas
);

/**
 * @route GET /api/estudiantes/:id
 * @desc Obtener estudiante por ID
 * @access Administrador, Docente, Estudiante (solo su propio perfil)
 */
router.get('/:id', 
    requireRole(['administrador', 'docente', 'estudiante']), 
    estudianteController.obtenerEstudiante
);

/**
 * @route POST /api/estudiantes
 * @desc Crear nuevo estudiante
 * @access Administrador
 */
router.post('/', 
    requireRole(['administrador']), 
    estudianteController.crearEstudiante
);

/**
 * @route PUT /api/estudiantes/:id
 * @desc Actualizar estudiante
 * @access Administrador, Estudiante (solo su propio perfil)
 */
router.put('/:id', 
    requireRole(['administrador', 'estudiante']), 
    estudianteController.actualizarEstudiante
);

/**
 * @route DELETE /api/estudiantes/:id
 * @desc Eliminar estudiante (soft delete)
 * @access Administrador
 */
router.delete('/:id', 
    requireRole(['administrador']), 
    estudianteController.eliminarEstudiante
);

/**
 * @route GET /api/estudiantes/:id/inscripciones
 * @desc Obtener inscripciones de un estudiante
 * @access Administrador, Docente, Estudiante (solo sus propias inscripciones)
 */
router.get('/:id/inscripciones', 
    requireRole(['administrador', 'docente', 'estudiante']), 
    estudianteController.obtenerInscripcionesPorEstudiante
);

/**
 * @route GET /api/estudiantes/:id/notas
 * @desc Obtener notas de un estudiante
 * @access Administrador, Docente, Estudiante (solo sus propias notas)
 */
router.get('/:id/notas', 
    requireRole(['administrador', 'docente', 'estudiante']), 
    estudianteController.obtenerNotasPorEstudiante
);

/**
 * @route GET /api/estudiantes/mencion/:id_mencion
 * @desc Obtener estudiantes por mención
 * @access Administrador, Docente
 */
router.get('/mencion/:id_mencion', 
    requireRole(['administrador', 'docente']), 
    estudianteController.obtenerEstudiantesPorMencion
);

/**
 * @route POST /api/estudiantes/importar
 * @desc Importar estudiantes masivamente
 * @access Administrador
 */
router.post('/importar', 
    requireRole(['administrador']), 
    estudianteController.importarEstudiantes
);

/**
 * @route PUT /api/estudiantes/:id/estado
 * @desc Cambiar estado académico de estudiante
 * @access Administrador
 */
router.put('/:id/estado', 
    requireRole(['administrador']), 
    estudianteController.cambiarEstadoAcademico
);

module.exports = router;
