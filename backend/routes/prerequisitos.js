const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const prerequisitoController = require('../controllers/prerequisitoController');

/**
 * Rutas para gestión de prerrequisitos
 * Todas las rutas requieren autenticación
 */

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

/**
 * @route GET /api/prerequisitos/materias/:id_materia
 * @desc Obtener prerrequisitos de una materia
 * @access Todos los usuarios autenticados
 */
router.get('/materias/:id_materia', 
    prerequisitoController.obtenerPrerequisitos
);

/**
 * @route POST /api/prerequisitos/materias/:id_materia
 * @desc Agregar prerrequisito a una materia
 * @access Administrador
 */
router.post('/materias/:id_materia', 
    requireRole(['administrador']), 
    prerequisitoController.agregarPrerequisito
);

/**
 * @route DELETE /api/prerequisitos/materias/:id_materia/:id_prerequisito
 * @desc Eliminar prerrequisito de una materia
 * @access Administrador
 */
router.delete('/materias/:id_materia/:id_prerequisito', 
    requireRole(['administrador']), 
    prerequisitoController.eliminarPrerequisito
);

/**
 * @route GET /api/prerequisitos/verificar/:id_estudiante/:id_materia
 * @desc Verificar si un estudiante cumple los prerrequisitos de una materia
 * @access Administrador, Docente, Estudiante (solo su propia información)
 */
router.get('/verificar/:id_estudiante/:id_materia', 
    requireRole(['administrador', 'docente', 'estudiante']), 
    prerequisitoController.verificarPrerequisitosEstudiante
);

/**
 * @route GET /api/prerequisitos/materias-disponibles/:id_estudiante
 * @desc Obtener materias disponibles para un estudiante según prerrequisitos
 * @access Administrador, Docente, Estudiante (solo su propia información)
 */
router.get('/materias-disponibles/:id_estudiante', 
    requireRole(['administrador', 'docente', 'estudiante']), 
    prerequisitoController.obtenerMateriasDisponibles
);

/**
 * @route GET /api/prerequisitos/arbol/:id_materia
 * @desc Obtener árbol completo de prerrequisitos de una materia
 * @access Todos los usuarios autenticados
 */
router.get('/arbol/:id_materia', 
    prerequisitoController.obtenerArbolPrerequisitos
);

module.exports = router;
