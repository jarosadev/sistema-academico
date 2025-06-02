const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validation');
const { authenticateToken, requireRole } = require('../middleware/auth');
const tipoEvaluacionController = require('../controllers/tipoEvaluacionController');

// Esquemas de validación
const Joi = require('joi');

const createSchema = Joi.object({
    nombre: Joi.string().required().messages({
        'string.empty': 'El nombre es requerido',
        'any.required': 'El nombre es requerido'
    }),
    porcentaje: Joi.number().min(0).max(100).required().messages({
        'number.base': 'El porcentaje debe ser un número',
        'number.min': 'El porcentaje no puede ser menor a 0',
        'number.max': 'El porcentaje no puede ser mayor a 100',
        'any.required': 'El porcentaje es requerido'
    }),
    orden: Joi.number().min(1).required().messages({
        'number.base': 'El orden debe ser un número',
        'number.min': 'El orden debe ser mayor a 0',
        'any.required': 'El orden es requerido'
    })
});

const updateSchema = Joi.object({
    nombre: Joi.string().messages({
        'string.empty': 'El nombre no puede estar vacío'
    }),
    porcentaje: Joi.number().min(0).max(100).messages({
        'number.base': 'El porcentaje debe ser un número',
        'number.min': 'El porcentaje no puede ser menor a 0',
        'number.max': 'El porcentaje no puede ser mayor a 100'
    }),
    orden: Joi.number().min(1).messages({
        'number.base': 'El orden debe ser un número',
        'number.min': 'El orden debe ser mayor a 0'
    }),
    activo: Joi.number().valid(0, 1).messages({  // Changed to accept 0 or 1
        'number.base': 'El campo activo debe ser un número (0 o 1)',
        'any.only': 'El campo activo debe ser 0 o 1'
    })
}).min(1).messages({
    'object.min': 'Debe proporcionar al menos un campo para actualizar'
});

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

/**
 * @route GET /api/tipos-evaluacion/materia/:id_materia
 * @desc Obtener tipos de evaluación por materia
 * @access Administrador, Docente
 */
router.get('/materia/:id_materia', 
    requireRole(['administrador', 'docente']),
    tipoEvaluacionController.obtenerPorMateria
);

/**
 * @route POST /api/tipos-evaluacion/materia/:id_materia
 * @desc Crear nuevo tipo de evaluación
 * @access Administrador, Docente
 */
router.post('/materia/:id_materia',
    requireRole(['administrador', 'docente']),
    validate(createSchema),
    tipoEvaluacionController.crear
);

/**
 * @route PUT /api/tipos-evaluacion/materia/:id_materia/:id_tipo_evaluacion
 * @desc Actualizar tipo de evaluación
 * @access Administrador, Docente
 */
router.put('/materia/:id_materia/:id_tipo_evaluacion',
    requireRole(['administrador', 'docente']),
    validate(updateSchema),
    tipoEvaluacionController.actualizar
);

/**
 * @route DELETE /api/tipos-evaluacion/materia/:id_materia/:id_tipo_evaluacion
 * @desc Eliminar tipo de evaluación
 * @access Administrador
 */
router.delete('/materia/:id_materia/:id_tipo_evaluacion',
    requireRole(['administrador']),
    tipoEvaluacionController.eliminar
);

module.exports = router;
