const express = require('express');
const router = express.Router();
const materiaController = require('../controllers/materiaController');
const { authenticateToken, requireRole } = require('../middleware/auth');

/**
 * Rutas para gestión de materias
 * Todas las rutas requieren autenticación
 */

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

/**
 * @route GET /api/materias
 * @desc Listar materias con paginación y filtros
 * @access Administrador, Docente, Estudiante
 */
router.get('/', 
    requireRole(['administrador', 'docente', 'estudiante']), 
    materiaController.listarMaterias
);

/**
 * @route GET /api/materias/estadisticas
 * @desc Obtener estadísticas de materias
 * @access Administrador
 */
router.get('/estadisticas', 
    requireRole(['administrador']), 
    materiaController.obtenerEstadisticas
);

/**
 * @route GET /api/materias/:id
 * @desc Obtener materia por ID
 * @access Administrador, Docente, Estudiante
 */
router.get('/:id', 
    requireRole(['administrador', 'docente', 'estudiante']), 
    materiaController.obtenerMateria
);

/**
 * @route POST /api/materias
 * @desc Crear nueva materia
 * @access Administrador
 */
router.post('/', 
    requireRole(['administrador']), 
    materiaController.crearMateria
);

/**
 * @route PUT /api/materias/:id
 * @desc Actualizar materia
 * @access Administrador
 */
router.put('/:id', 
    requireRole(['administrador']), 
    materiaController.actualizarMateria
);

/**
 * @route DELETE /api/materias/:id
 * @desc Eliminar materia (soft delete)
 * @access Administrador
 */
router.delete('/:id', 
    requireRole(['administrador']), 
    materiaController.eliminarMateria
);

/**
 * @route GET /api/materias/mencion/:id_mencion
 * @desc Obtener materias por mención
 * @access Administrador, Docente, Estudiante
 */
router.get('/mencion/:id_mencion', 
    requireRole(['administrador', 'docente', 'estudiante']), 
    materiaController.obtenerMateriasPorMencion || ((req, res) => {
        res.json({ success: false, message: 'Función no implementada' });
    })
);

/**
 * @route GET /api/materias/:id/prerequisitos
 * @desc Obtener prerequisitos de una materia
 * @access Administrador, Docente, Estudiante
 */
router.get('/:id/prerequisitos', 
    requireRole(['administrador', 'docente', 'estudiante']), 
    materiaController.obtenerPrerequisitos || ((req, res) => {
        res.json({ success: false, message: 'Función no implementada' });
    })
);

module.exports = router;
