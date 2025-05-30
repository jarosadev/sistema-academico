const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');
const { verifyToken, hasPermission, isUserLocked } = require('../config/auth');
const { HTTP_STATUS, MENSAJES_ERROR } = require('../config/constants');
const { createError } = require('./errorHandler');

// Middleware de autenticación JWT
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return next(createError(
                'Token de acceso requerido',
                HTTP_STATUS.UNAUTHORIZED,
                'TOKEN_REQUIRED'
            ));
        }

        // Verificar token JWT
        const decoded = verifyToken(token);
        
        // Verificar si el token existe en la base de datos y está activo
        const tokenHash = require('crypto').createHash('sha256').update(token).digest('hex');
        const sessionQuery = `
            SELECT s.*, u.activo as usuario_activo, u.bloqueado_hasta
            FROM sesiones s
            INNER JOIN usuarios u ON s.id_usuario = u.id_usuario
            WHERE s.token_hash = ? AND s.activo = TRUE AND s.fecha_expiracion > NOW()
        `;
        
        const sessions = await executeQuery(sessionQuery, [tokenHash]);
        
        if (sessions.length === 0) {
            return next(createError(
                'Sesión inválida o expirada',
                HTTP_STATUS.UNAUTHORIZED,
                'INVALID_SESSION'
            ));
        }

        const session = sessions[0];

        // Verificar si el usuario está activo
        if (!session.usuario_activo) {
            return next(createError(
                'Usuario inactivo',
                HTTP_STATUS.UNAUTHORIZED,
                'USER_INACTIVE'
            ));
        }

        // Verificar si el usuario está bloqueado
        if (isUserLocked(session.bloqueado_hasta)) {
            return next(createError(
                MENSAJES_ERROR.USUARIO_BLOQUEADO,
                HTTP_STATUS.UNAUTHORIZED,
                'USER_LOCKED'
            ));
        }

        // Obtener información completa del usuario con roles
        const userQuery = `
            SELECT 
                u.id_usuario,
                u.correo,
                u.activo,
                u.ultimo_acceso,
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id_rol', r.id_rol,
                        'nombre', r.nombre,
                        'permisos', r.permisos
                    )
                ) as roles
            FROM usuarios u
            INNER JOIN usuario_roles ur ON u.id_usuario = ur.id_usuario
            INNER JOIN roles r ON ur.id_rol = r.id_rol
            WHERE u.id_usuario = ? AND u.activo = TRUE
            GROUP BY u.id_usuario
        `;

        const users = await executeQuery(userQuery, [decoded.id_usuario]);
        
        if (users.length === 0) {
            return next(createError(
                'Usuario no encontrado',
                HTTP_STATUS.UNAUTHORIZED,
                'USER_NOT_FOUND'
            ));
        }

        const user = users[0];
        
        // Parsear roles si vienen como string
        if (typeof user.roles === 'string') {
            user.roles = JSON.parse(user.roles);
        }

        // Agregar información del usuario a la request
        req.user = user;
        req.token = token;
        req.sessionId = session.id_sesion;

        // Actualizar último acceso del usuario
        await executeQuery(
            'UPDATE usuarios SET ultimo_acceso = NOW() WHERE id_usuario = ?',
            [user.id_usuario]
        );

        next();
    } catch (error) {
        if (error.message.includes('Token expirado')) {
            return next(createError(
                MENSAJES_ERROR.TOKEN_EXPIRADO,
                HTTP_STATUS.UNAUTHORIZED,
                'TOKEN_EXPIRED'
            ));
        } else if (error.message.includes('Token inválido')) {
            return next(createError(
                MENSAJES_ERROR.TOKEN_INVALIDO,
                HTTP_STATUS.UNAUTHORIZED,
                'TOKEN_INVALID'
            ));
        }
        
        next(createError(
            'Error de autenticación',
            HTTP_STATUS.UNAUTHORIZED,
            'AUTH_ERROR'
        ));
    }
};

// Middleware de autorización por permisos
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(createError(
                'Usuario no autenticado',
                HTTP_STATUS.UNAUTHORIZED,
                'NOT_AUTHENTICATED'
            ));
        }

        if (!hasPermission(req.user.roles, permission)) {
            return next(createError(
                `Permiso requerido: ${permission}`,
                HTTP_STATUS.FORBIDDEN,
                'INSUFFICIENT_PERMISSIONS'
            ));
        }

        next();
    };
};

// Middleware de autorización por rol
const requireRole = (roleNames) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(createError(
                'Usuario no autenticado',
                HTTP_STATUS.UNAUTHORIZED,
                'NOT_AUTHENTICATED'
            ));
        }

        // Si roleNames es un string, convertirlo a array
        const roles = Array.isArray(roleNames) ? roleNames : [roleNames];
        
        const hasRole = req.user.roles.some(role => 
            roles.includes(role.nombre)
        );
        
        if (!hasRole) {
            return next(createError(
                `Rol requerido: ${roles.join('|')}`,
                HTTP_STATUS.FORBIDDEN,
                'INSUFFICIENT_ROLE'
            ));
        }

        next();
    };
};

// Middleware de autorización por múltiples roles
const requireAnyRole = (roleNames) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(createError(
                'Usuario no autenticado',
                HTTP_STATUS.UNAUTHORIZED,
                'NOT_AUTHENTICATED'
            ));
        }

        const hasAnyRole = req.user.roles.some(role => 
            roleNames.includes(role.nombre)
        );
        
        if (!hasAnyRole) {
            return next(createError(
                `Uno de estos roles es requerido: ${roleNames.join(', ')}`,
                HTTP_STATUS.FORBIDDEN,
                'INSUFFICIENT_ROLES'
            ));
        }

        next();
    };
};

// Middleware para verificar propiedad de recurso (estudiantes pueden ver solo sus datos)
const requireOwnership = (resourceType) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return next(createError(
                    'Usuario no autenticado',
                    HTTP_STATUS.UNAUTHORIZED,
                    'NOT_AUTHENTICATED'
                ));
            }

            // Los administradores pueden acceder a todo
            const isAdmin = req.user.roles.some(role => role.nombre === 'administrador');
            if (isAdmin) {
                return next();
            }

            const resourceId = req.params.id;
            const userId = req.user.id_usuario;

            let query = '';
            let params = [];

            switch (resourceType) {
                case 'estudiante':
                    query = 'SELECT id_usuario FROM estudiantes WHERE id_estudiante = ?';
                    params = [resourceId];
                    break;
                case 'docente':
                    query = 'SELECT id_usuario FROM docentes WHERE id_docente = ?';
                    params = [resourceId];
                    break;
                case 'inscripcion':
                    query = `
                        SELECT e.id_usuario 
                        FROM inscripciones i
                        INNER JOIN estudiantes e ON i.id_estudiante = e.id_estudiante
                        WHERE i.id_inscripcion = ?
                    `;
                    params = [resourceId];
                    break;
                case 'nota':
                    query = `
                        SELECT e.id_usuario 
                        FROM notas n
                        INNER JOIN inscripciones i ON n.id_inscripcion = i.id_inscripcion
                        INNER JOIN estudiantes e ON i.id_estudiante = e.id_estudiante
                        WHERE n.id_nota = ?
                    `;
                    params = [resourceId];
                    break;
                default:
                    return next(createError(
                        'Tipo de recurso no válido',
                        HTTP_STATUS.BAD_REQUEST,
                        'INVALID_RESOURCE_TYPE'
                    ));
            }

            const results = await executeQuery(query, params);
            
            if (results.length === 0) {
                return next(createError(
                    'Recurso no encontrado',
                    HTTP_STATUS.NOT_FOUND,
                    'RESOURCE_NOT_FOUND'
                ));
            }

            if (results[0].id_usuario !== userId) {
                return next(createError(
                    'No tiene permisos para acceder a este recurso',
                    HTTP_STATUS.FORBIDDEN,
                    'RESOURCE_ACCESS_DENIED'
                ));
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

// Middleware opcional de autenticación (no falla si no hay token)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return next(); // Continuar sin usuario autenticado
        }

        // Intentar autenticar, pero no fallar si hay error
        await authenticateToken(req, res, (error) => {
            if (error) {
                // Log del error pero continuar
                console.warn('Error en autenticación opcional:', error.message);
            }
            next();
        });
    } catch (error) {
        // Continuar sin autenticación en caso de error
        next();
    }
};

// Función helper para verificar si el usuario actual es el propietario
const isOwner = (req, resourceUserId) => {
    if (!req.user) return false;
    
    // Los administradores son considerados propietarios de todo
    const isAdmin = req.user.roles.some(role => role.nombre === 'administrador');
    if (isAdmin) return true;
    
    return req.user.id_usuario === resourceUserId;
};

// Función helper para verificar si el usuario tiene un rol específico
const hasRole = (req, roleName) => {
    if (!req.user || !req.user.roles) return false;
    return req.user.roles.some(role => role.nombre === roleName);
};

module.exports = {
    authenticateToken,
    requirePermission,
    requireRole,
    requireAnyRole,
    requireOwnership,
    optionalAuth,
    isOwner,
    hasRole
};
