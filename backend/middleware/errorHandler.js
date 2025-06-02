const { HTTP_STATUS, MENSAJES_ERROR, LOG_LEVELS } = require('../config/constants');

// Middleware de manejo de errores centralizado
const errorHandler = (error, req, res, next) => {
    let statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    let message = error.message || MENSAJES_ERROR.ERROR_INTERNO;
    let code = error.code || 'INTERNAL_ERROR';
    let details = null;

    // Log del error
    console.error(`[${new Date().toISOString()}] ERROR:`, {
        message: error.message,
        stack: error.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id_usuario || null
    });

    // Manejo específico de tipos de error
    switch (error.name) {
        case 'ValidationError':
            statusCode = HTTP_STATUS.BAD_REQUEST;
            message = 'Datos de entrada inválidos';
            code = 'VALIDATION_ERROR';
            details = error.details || error.message;
            break;

        case 'UnauthorizedError':
        case 'JsonWebTokenError':
            statusCode = HTTP_STATUS.UNAUTHORIZED;
            message = MENSAJES_ERROR.TOKEN_INVALIDO;
            code = 'UNAUTHORIZED';
            break;

        case 'TokenExpiredError':
            statusCode = HTTP_STATUS.UNAUTHORIZED;
            message = MENSAJES_ERROR.TOKEN_EXPIRADO;
            code = 'TOKEN_EXPIRED';
            break;

        case 'ForbiddenError':
            statusCode = HTTP_STATUS.FORBIDDEN;
            message = MENSAJES_ERROR.ACCESO_DENEGADO;
            code = 'FORBIDDEN';
            break;

        case 'NotFoundError':
            statusCode = HTTP_STATUS.NOT_FOUND;
            message = MENSAJES_ERROR.REGISTRO_NO_ENCONTRADO;
            code = 'NOT_FOUND';
            break;

        case 'ConflictError':
            statusCode = HTTP_STATUS.CONFLICT;
            message = MENSAJES_ERROR.REGISTRO_DUPLICADO;
            code = 'CONFLICT';
            break;

        case 'DatabaseError':
            statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
            message = MENSAJES_ERROR.ERROR_BASE_DATOS;
            code = 'DATABASE_ERROR';
            // No exponer detalles de BD en producción
            if (process.env.NODE_ENV === 'development') {
                details = error.originalError?.message;
            }
            break;

        case 'SequelizeValidationError':
        case 'SequelizeUniqueConstraintError':
            statusCode = HTTP_STATUS.BAD_REQUEST;
            message = 'Error de validación en base de datos';
            code = 'DB_VALIDATION_ERROR';
            if (process.env.NODE_ENV === 'development') {
                details = error.errors?.map(e => e.message);
            }
            break;

        case 'MulterError':
            statusCode = HTTP_STATUS.BAD_REQUEST;
            message = 'Error en carga de archivo';
            code = 'FILE_UPLOAD_ERROR';
            if (error.code === 'LIMIT_FILE_SIZE') {
                message = 'El archivo es demasiado grande';
            } else if (error.code === 'LIMIT_FILE_COUNT') {
                message = 'Demasiados archivos';
            }
            break;

        default:
            // Errores específicos de MySQL
            if (error.code) {
                switch (error.code) {
                    case 'ER_DUP_ENTRY':
                        statusCode = HTTP_STATUS.CONFLICT;
                        message = MENSAJES_ERROR.REGISTRO_DUPLICADO;
                        code = 'DUPLICATE_ENTRY';
                        break;

                    case 'ER_NO_REFERENCED_ROW_2':
                        statusCode = HTTP_STATUS.BAD_REQUEST;
                        message = 'Referencia inválida en los datos';
                        code = 'INVALID_REFERENCE';
                        break;

                    case 'ER_ROW_IS_REFERENCED_2':
                        statusCode = HTTP_STATUS.CONFLICT;
                        message = 'No se puede eliminar: registro en uso';
                        code = 'RECORD_IN_USE';
                        break;

                    case 'ER_DATA_TOO_LONG':
                        statusCode = HTTP_STATUS.BAD_REQUEST;
                        message = 'Datos demasiado largos para el campo';
                        code = 'DATA_TOO_LONG';
                        break;

                    case 'ER_BAD_NULL_ERROR':
                        statusCode = HTTP_STATUS.BAD_REQUEST;
                        message = 'Campo requerido no puede estar vacío';
                        code = 'REQUIRED_FIELD_NULL';
                        break;

                    case 'ECONNREFUSED':
                        statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;
                        message = MENSAJES_ERROR.SERVICIO_NO_DISPONIBLE;
                        code = 'DATABASE_CONNECTION_ERROR';
                        break;

                    case 'PROTOCOL_CONNECTION_LOST':
                        statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;
                        message = 'Conexión con base de datos perdida';
                        code = 'DATABASE_CONNECTION_LOST';
                        break;
                }
            }
            break;
    }

    // Estructura de respuesta de error
    const errorResponse = {
        success: false,
        error: true,
        message,
        code,
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method
    };

    // Agregar detalles solo en desarrollo o si están disponibles
    if (details && (process.env.NODE_ENV === 'development' || statusCode < 500)) {
        errorResponse.details = details;
    }

    // Agregar stack trace solo en desarrollo
    if (process.env.NODE_ENV === 'development' && error.stack) {
        errorResponse.stack = error.stack;
    }

    // Agregar ID de solicitud si existe
    if (req.requestId) {
        errorResponse.requestId = req.requestId;
    }

    // Ensure statusCode is a valid HTTP status code
    const validStatusCode = typeof statusCode === 'number' ? statusCode : 500;
    res.status(validStatusCode).json(errorResponse);
};


// Middleware para manejar rutas no encontradas
const notFoundHandler = (req, res, next) => {
    const error = new Error(`Ruta no encontrada: ${req.originalUrl}`);
    error.statusCode = HTTP_STATUS.NOT_FOUND;
    error.code = 'ROUTE_NOT_FOUND';
    next(error);
};

// Función para crear errores personalizados
const createError = (message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, code = 'CUSTOM_ERROR', details = null) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    if (details) {
        error.details = details;
    }
    return error;
};


// Función para manejar errores asíncronos
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// Función para validar y formatear errores de Joi
const handleJoiError = (error) => {
    const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
    }));

    const customError = new Error('Datos de entrada inválidos');
    customError.name = 'ValidationError';
    customError.statusCode = HTTP_STATUS.BAD_REQUEST;
    customError.code = 'VALIDATION_ERROR';
    customError.details = details;

    return customError;
};

// Middleware para capturar errores de JSON malformado
const jsonErrorHandler = (error, req, res, next) => {
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        const customError = createError(
            'JSON malformado en el cuerpo de la solicitud',
            HTTP_STATUS.BAD_REQUEST,
            'INVALID_JSON'
        );
        return next(customError);
    }
    next(error);
};

module.exports = {
    errorHandler,
    notFoundHandler,
    createError,
    asyncHandler,
    handleJoiError,
    jsonErrorHandler
};
