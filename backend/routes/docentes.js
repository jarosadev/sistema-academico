const express = require('express');
const router = express.Router();
const docenteController = require('../controllers/docenteController');
const { authenticateToken, requireRole } = require('../middleware/auth');

/**
 * Rutas para gestión de docentes
 * Todas las rutas requieren autenticación
 */

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

/**
 * @route GET /api/docentes
 * @desc Listar docentes con paginación y filtros
 * @access Administrador, Docente
 */
router.get('/', 
    requireRole(['administrador', 'docente']), 
    docenteController.listarDocentes
);

/**
 * @route GET /api/docentes/estadisticas
 * @desc Obtener estadísticas de docentes
 * @access Administrador
 */
router.get('/estadisticas', 
    requireRole(['administrador']), 
    docenteController.obtenerEstadisticas
);

/**
 * @route GET /api/docentes/:id
 * @desc Obtener docente por ID
 * @access Administrador, Docente (solo su propio perfil)
 */
router.get('/:id', 
    requireRole(['administrador', 'docente']), 
    docenteController.obtenerDocente
);

/**
 * @route POST /api/docentes
 * @desc Crear nuevo docente
 * @access Administrador
 */
router.post('/', 
    requireRole(['administrador']), 
    docenteController.crearDocente
);

/**
 * @route PUT /api/docentes/:id
 * @desc Actualizar docente
 * @access Administrador, Docente (solo su propio perfil)
 */
router.put('/:id', 
    requireRole(['administrador', 'docente']), 
    docenteController.actualizarDocente
);

/**
 * @route DELETE /api/docentes/:id
 * @desc Eliminar docente (soft delete)
 * @access Administrador
 */
router.delete('/:id', 
    requireRole(['administrador']), 
    docenteController.eliminarDocente
);

/**
 * @route GET /api/docentes/:id/materias
 * @desc Obtener materias asignadas a un docente
 * @access Administrador, Docente (solo sus propias materias)
 */
router.get('/:id/materias', 
    requireRole(['administrador', 'docente']), 
    docenteController.obtenerMateriasPorDocente || ((req, res) => {
        res.json({ success: false, message: 'Función no implementada' });
    })
);

/**
 * @route POST /api/docentes/:id/materias
 * @desc Asignar materia a docente
 * @access Administrador
 */
router.post('/:id/materias', 
    requireRole(['administrador']), 
    docenteController.asignarMateria || ((req, res) => {
        res.json({ success: false, message: 'Función no implementada' });
    })
);

/**
 * @route DELETE /api/docentes/:id/materias/:id_materia
 * @desc Desasignar materia de docente
 * @access Administrador
 */
router.delete('/:id/materias/:id_materia', 
    requireRole(['administrador']), 
    docenteController.desasignarMateria || ((req, res) => {
        res.json({ success: false, message: 'Función no implementada' });
    })
);

/**
 * @route GET /api/docentes/:id/estudiantes
 * @desc Obtener estudiantes de un docente (por materias asignadas)
 * @access Administrador, Docente (solo sus propios estudiantes)
 */
router.get('/:id/estudiantes', 
    requireRole(['administrador', 'docente']), 
    docenteController.obtenerEstudiantesPorDocente || ((req, res) => {
        res.json({ success: false, message: 'Función no implementada' });
    })
);

/**
 * @route GET /api/docentes/:id/carga-academica
 * @desc Obtener carga académica de un docente
 * @access Administrador, Docente (solo su propia carga)
 */
router.get('/:id/carga-academica', 
    requireRole(['administrador', 'docente']), 
    docenteController.obtenerCargaAcademica || ((req, res) => {
        res.json({ success: false, message: 'Función no implementada' });
    })
);

/**
 * @route GET /api/docentes/especialidad/:especialidad
 * @desc Obtener docentes por especialidad
 * @access Administrador
 */
router.get('/especialidad/:especialidad', 
    requireRole(['administrador']), 
    docenteController.obtenerDocentesPorEspecialidad || ((req, res) => {
        res.json({ success: false, message: 'Función no implementada' });
    })
);

/**
 * @route POST /api/docentes/asignacion-masiva
 * @desc Asignación masiva de materias a docentes
 * @access Administrador
 */
router.post('/asignacion-masiva', 
    requireRole(['administrador']), 
    docenteController.asignacionMasiva || ((req, res) => {
        res.json({ success: false, message: 'Función no implementada' });
    })
);

module.exports = router;
