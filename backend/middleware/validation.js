const Joi = require('joi');
const { HTTP_STATUS, REGEX, MENSAJES_ERROR } = require('../config/constants');
const { handleJoiError } = require('./errorHandler');

// Esquemas de validación para usuarios
const userSchemas = {
    register: Joi.object({
        correo: Joi.string()
            .email()
            .max(100)
            .required()
            .messages({
                'string.email': 'Formato de correo electrónico inválido',
                'string.max': 'El correo no puede exceder 100 caracteres',
                'any.required': 'El correo es requerido'
            }),
        password: Joi.string()
            .min(8)
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/)
            .required()
            .messages({
                'string.min': 'La contraseña debe tener al menos 8 caracteres',
                'string.pattern.base': 'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
                'any.required': 'La contraseña es requerida'
            }),
        roles: Joi.array()
            .items(Joi.number().integer().positive())
            .min(1)
            .required()
            .messages({
                'array.min': 'Debe asignar al menos un rol',
                'any.required': 'Los roles son requeridos'
            })
    }),

    login: Joi.object({
        correo: Joi.string()
            .email()
            .required()
            .messages({
                'string.email': 'Formato de correo electrónico inválido',
                'any.required': 'El correo es requerido'
            }),
        password: Joi.string()
            .required()
            .messages({
                'any.required': 'La contraseña es requerida'
            })
    }),

    updatePassword: Joi.object({
        password_actual: Joi.string()
            .required()
            .messages({
                'any.required': 'La contraseña actual es requerida'
            }),
        password_nueva: Joi.string()
            .min(8)
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/)
            .required()
            .messages({
                'string.min': 'La nueva contraseña debe tener al menos 8 caracteres',
                'string.pattern.base': 'La nueva contraseña debe contener al menos una mayúscula, una minúscula y un número',
                'any.required': 'La nueva contraseña es requerida'
            })
    })
};

// Esquemas de validación para estudiantes
const studentSchemas = {
    create: Joi.object({
        nombre: Joi.string()
            .pattern(REGEX.SOLO_LETRAS)
            .max(100)
            .required()
            .messages({
                'string.pattern.base': 'El nombre solo puede contener letras',
                'string.max': 'El nombre no puede exceder 100 caracteres',
                'any.required': 'El nombre es requerido'
            }),
        apellido: Joi.string()
            .pattern(REGEX.SOLO_LETRAS)
            .max(100)
            .required()
            .messages({
                'string.pattern.base': 'El apellido solo puede contener letras',
                'string.max': 'El apellido no puede exceder 100 caracteres',
                'any.required': 'El apellido es requerido'
            }),
        ci: Joi.string()
            .pattern(REGEX.CI)
            .required()
            .messages({
                'string.pattern.base': 'El CI debe tener 7 u 8 dígitos',
                'any.required': 'El CI es requerido'
            }),
        fecha_nacimiento: Joi.date()
            .max('now')
            .required()
            .messages({
                'date.max': 'La fecha de nacimiento no puede ser futura',
                'any.required': 'La fecha de nacimiento es requerida'
            }),
        direccion: Joi.string()
            .max(500)
            .allow('')
            .messages({
                'string.max': 'La dirección no puede exceder 500 caracteres'
            }),
        telefono: Joi.string()
            .pattern(REGEX.TELEFONO)
            .allow('')
            .messages({
                'string.pattern.base': 'El teléfono debe tener formato válido (ej: 70123456)'
            }),
        id_usuario: Joi.number()
            .integer()
            .positive()
            .required()
            .messages({
                'number.positive': 'El ID de usuario debe ser positivo',
                'any.required': 'El ID de usuario es requerido'
            }),
        id_mencion: Joi.number()
            .integer()
            .positive()
            .allow(null)
            .messages({
                'number.positive': 'El ID de mención debe ser positivo'
            })
    }),

    update: Joi.object({
        nombre: Joi.string()
            .pattern(REGEX.SOLO_LETRAS)
            .max(100)
            .messages({
                'string.pattern.base': 'El nombre solo puede contener letras',
                'string.max': 'El nombre no puede exceder 100 caracteres'
            }),
        apellido: Joi.string()
            .pattern(REGEX.SOLO_LETRAS)
            .max(100)
            .messages({
                'string.pattern.base': 'El apellido solo puede contener letras',
                'string.max': 'El apellido no puede exceder 100 caracteres'
            }),
        direccion: Joi.string()
            .max(500)
            .allow('')
            .messages({
                'string.max': 'La dirección no puede exceder 500 caracteres'
            }),
        telefono: Joi.string()
            .pattern(REGEX.TELEFONO)
            .allow('')
            .messages({
                'string.pattern.base': 'El teléfono debe tener formato válido (ej: 70123456)'
            }),
        id_mencion: Joi.number()
            .integer()
            .positive()
            .allow(null)
            .messages({
                'number.positive': 'El ID de mención debe ser positivo'
            }),
        estado_academico: Joi.string()
            .valid('activo', 'inactivo', 'graduado', 'suspendido')
            .messages({
                'any.only': 'Estado académico inválido'
            })
    })
};

// Esquemas de validación para docentes
const teacherSchemas = {
    create: Joi.object({
        nombre: Joi.string()
            .pattern(REGEX.SOLO_LETRAS)
            .max(100)
            .required()
            .messages({
                'string.pattern.base': 'El nombre solo puede contener letras',
                'string.max': 'El nombre no puede exceder 100 caracteres',
                'any.required': 'El nombre es requerido'
            }),
        apellido: Joi.string()
            .pattern(REGEX.SOLO_LETRAS)
            .max(100)
            .required()
            .messages({
                'string.pattern.base': 'El apellido solo puede contener letras',
                'string.max': 'El apellido no puede exceder 100 caracteres',
                'any.required': 'El apellido es requerido'
            }),
        ci: Joi.string()
            .pattern(REGEX.CI)
            .required()
            .messages({
                'string.pattern.base': 'El CI debe tener 7 u 8 dígitos',
                'any.required': 'El CI es requerido'
            }),
        especialidad: Joi.string()
            .max(200)
            .allow('')
            .messages({
                'string.max': 'La especialidad no puede exceder 200 caracteres'
            }),
        telefono: Joi.string()
            .pattern(REGEX.TELEFONO)
            .allow('')
            .messages({
                'string.pattern.base': 'El teléfono debe tener formato válido (ej: 70123456)'
            }),
        id_usuario: Joi.number()
            .integer()
            .positive()
            .required()
            .messages({
                'number.positive': 'El ID de usuario debe ser positivo',
                'any.required': 'El ID de usuario es requerido'
            })
    }),

    update: Joi.object({
        nombre: Joi.string()
            .pattern(REGEX.SOLO_LETRAS)
            .max(100)
            .messages({
                'string.pattern.base': 'El nombre solo puede contener letras',
                'string.max': 'El nombre no puede exceder 100 caracteres'
            }),
        apellido: Joi.string()
            .pattern(REGEX.SOLO_LETRAS)
            .max(100)
            .messages({
                'string.pattern.base': 'El apellido solo puede contener letras',
                'string.max': 'El apellido no puede exceder 100 caracteres'
            }),
        especialidad: Joi.string()
            .max(200)
            .allow('')
            .messages({
                'string.max': 'La especialidad no puede exceder 200 caracteres'
            }),
        telefono: Joi.string()
            .pattern(REGEX.TELEFONO)
            .allow('')
            .messages({
                'string.pattern.base': 'El teléfono debe tener formato válido (ej: 70123456)'
            }),
        activo: Joi.boolean()
            .messages({
                'boolean.base': 'El estado activo debe ser verdadero o falso'
            })
    })
};

// Esquemas de validación para materias
const subjectSchemas = {
    create: Joi.object({
        nombre: Joi.string()
            .max(150)
            .required()
            .messages({
                'string.max': 'El nombre no puede exceder 150 caracteres',
                'any.required': 'El nombre es requerido'
            }),
        sigla: Joi.string()
            .pattern(REGEX.SIGLA_MATERIA)
            .required()
            .messages({
                'string.pattern.base': 'La sigla debe tener formato ABC123',
                'any.required': 'La sigla es requerida'
            }),
        semestre: Joi.number()
            .integer()
            .min(1)
            .max(10)
            .required()
            .messages({
                'number.min': 'El semestre debe ser entre 1 y 10',
                'number.max': 'El semestre debe ser entre 1 y 10',
                'any.required': 'El semestre es requerido'
            }),
        id_mencion: Joi.number()
            .integer()
            .positive()
            .required()
            .messages({
                'number.positive': 'El ID de mención debe ser positivo',
                'any.required': 'El ID de mención es requerido'
            }),
        descripcion: Joi.string()
            .max(1000)
            .allow('')
            .messages({
                'string.max': 'La descripción no puede exceder 1000 caracteres'
            })
    }),

    update: Joi.object({
        nombre: Joi.string()
            .max(150)
            .messages({
                'string.max': 'El nombre no puede exceder 150 caracteres'
            }),
        descripcion: Joi.string()
            .max(1000)
            .allow('')
            .messages({
                'string.max': 'La descripción no puede exceder 1000 caracteres'
            }),
        activo: Joi.boolean()
            .messages({
                'boolean.base': 'El estado activo debe ser verdadero o falso'
            })
    })
};

// Esquemas de validación para inscripciones
const enrollmentSchemas = {
    create: Joi.object({
        id_estudiante: Joi.number()
            .integer()
            .positive()
            .required()
            .messages({
                'number.positive': 'El ID de estudiante debe ser positivo',
                'any.required': 'El ID de estudiante es requerido'
            }),
        id_materia: Joi.number()
            .integer()
            .positive()
            .required()
            .messages({
                'number.positive': 'El ID de materia debe ser positivo',
                'any.required': 'El ID de materia es requerido'
            }),
        gestion: Joi.number()
            .integer()
            .min(2020)
            .max(2030)
            .required()
            .messages({
                'number.min': 'La gestión debe ser válida',
                'number.max': 'La gestión debe ser válida',
                'any.required': 'La gestión es requerida'
            }),
        paralelo: Joi.string()
            .valid('A', 'B', 'C', 'D', 'E')
            .default('A')
            .messages({
                'any.only': 'El paralelo debe ser A, B, C, D o E'
            })
    }),

    update: Joi.object({
        estado: Joi.string()
            .valid('inscrito', 'aprobado', 'reprobado', 'abandonado')
            .messages({
                'any.only': 'Estado de inscripción inválido'
            }),
        paralelo: Joi.string()
            .valid('A', 'B', 'C', 'D', 'E')
            .messages({
                'any.only': 'El paralelo debe ser A, B, C, D o E'
            })
    })
};

// Esquemas de validación para notas
const gradeSchemas = {
    create: Joi.object({
        id_inscripcion: Joi.number()
            .integer()
            .positive()
            .required()
            .messages({
                'number.positive': 'El ID de inscripción debe ser positivo',
                'any.required': 'El ID de inscripción es requerido'
            }),
        calificacion: Joi.number()
            .min(0)
            .max(100)
            .precision(2)
            .required()
            .messages({
                'number.min': 'La calificación debe ser entre 0 y 100',
                'number.max': 'La calificación debe ser entre 0 y 100',
                'any.required': 'La calificación es requerida'
            }),
        tipo_evaluacion: Joi.string()
            .valid('parcial1', 'parcial2', 'final', 'segunda_instancia')
            .required()
            .messages({
                'any.only': 'Tipo de evaluación inválido',
                'any.required': 'El tipo de evaluación es requerido'
            }),
        observaciones: Joi.string()
            .max(500)
            .allow('')
            .messages({
                'string.max': 'Las observaciones no pueden exceder 500 caracteres'
            })
    }),

    update: Joi.object({
        calificacion: Joi.number()
            .min(0)
            .max(100)
            .precision(2)
            .messages({
                'number.min': 'La calificación debe ser entre 0 y 100',
                'number.max': 'La calificación debe ser entre 0 y 100'
            }),
        observaciones: Joi.string()
            .max(500)
            .allow('')
            .messages({
                'string.max': 'Las observaciones no pueden exceder 500 caracteres'
            })
    })
};

// Esquemas de validación para menciones
const mentionSchemas = {
    create: Joi.object({
        nombre: Joi.string()
            .max(100)
            .required()
            .messages({
                'string.max': 'El nombre no puede exceder 100 caracteres',
                'any.required': 'El nombre es requerido'
            }),
        descripcion: Joi.string()
            .max(1000)
            .allow('')
            .messages({
                'string.max': 'La descripción no puede exceder 1000 caracteres'
            }),
        materias_requeridas: Joi.number()
            .integer()
            .min(0)
            .max(100)
            .default(0)
            .messages({
                'number.min': 'Las materias requeridas deben ser un número positivo',
                'number.max': 'Las materias requeridas no pueden exceder 100'
            })
    }),

    update: Joi.object({
        nombre: Joi.string()
            .max(100)
            .messages({
                'string.max': 'El nombre no puede exceder 100 caracteres'
            }),
        descripcion: Joi.string()
            .max(1000)
            .allow('')
            .messages({
                'string.max': 'La descripción no puede exceder 1000 caracteres'
            }),
        materias_requeridas: Joi.number()
            .integer()
            .min(0)
            .max(100)
            .messages({
                'number.min': 'Las materias requeridas deben ser un número positivo',
                'number.max': 'Las materias requeridas no pueden exceder 100'
            }),
        activo: Joi.boolean()
            .messages({
                'boolean.base': 'El estado activo debe ser verdadero o falso'
            })
    })
};

// Función middleware para validar datos
const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
            convert: true
        });

        if (error) {
            return next(handleJoiError(error));
        }

        // Reemplazar req.body con los datos validados y limpiados
        req.body = value;
        next();
    };
};

// Función para validar parámetros de consulta
const validateQuery = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true,
            convert: true
        });

        if (error) {
            return next(handleJoiError(error));
        }

        req.query = value;
        next();
    };
};

// Función para validar parámetros de ruta
const validateParams = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.params, {
            abortEarly: false,
            convert: true
        });

        if (error) {
            return next(handleJoiError(error));
        }

        req.params = value;
        next();
    };
};

// Esquema para validar ID en parámetros
const idParamSchema = Joi.object({
    id: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            'number.positive': 'El ID debe ser un número positivo',
            'any.required': 'El ID es requerido'
        })
});

// Esquema para validar parámetros de paginación
const paginationSchema = Joi.object({
    page: Joi.number()
        .integer()
        .min(1)
        .default(1)
        .messages({
            'number.min': 'La página debe ser mayor a 0'
        }),
    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(10)
        .messages({
            'number.min': 'El límite debe ser mayor a 0',
            'number.max': 'El límite no puede exceder 100'
        }),
    search: Joi.string()
        .max(100)
        .allow('')
        .messages({
            'string.max': 'La búsqueda no puede exceder 100 caracteres'
        }),
    sort: Joi.string()
        .valid('asc', 'desc')
        .default('asc')
        .messages({
            'any.only': 'El orden debe ser asc o desc'
        })
});

module.exports = {
    validate,
    validateQuery,
    validateParams,
    userSchemas,
    studentSchemas,
    teacherSchemas,
    subjectSchemas,
    enrollmentSchemas,
    gradeSchemas,
    mentionSchemas,
    idParamSchema,
    paginationSchema
};
