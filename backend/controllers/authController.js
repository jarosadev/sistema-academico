const bcrypt = require('bcryptjs');
const { generateToken, generateRefreshToken, generateTokenHash, isUserLocked } = require('../config/auth');
const { executeQuery } = require('../config/database');
const Usuario = require('../models/Usuario');
const { createError, asyncHandler } = require('../middleware/errorHandler');
const { HTTP_STATUS, MENSAJES_ERROR, MENSAJES_EXITO } = require('../config/constants');
const { auditAction } = require('../middleware/audit');

// Registro de nuevo usuario
const register = asyncHandler(async (req, res) => {
    const { correo, password, roles } = req.body;

    // Crear usuario
    const newUser = await Usuario.create({
        correo,
        password,
        roles
    });

    // Generar tokens
    const tokenPayload = {
        id_usuario: newUser.id_usuario,
        correo: newUser.correo,
        roles: newUser.roles.map(role => role.nombre)
    };

    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Guardar sesión en base de datos
    const tokenHash = generateTokenHash(accessToken);
    const expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    await executeQuery(
        `INSERT INTO sesiones (id_usuario, token_hash, ip_address, user_agent, fecha_expiracion) 
         VALUES (?, ?, ?, ?, ?)`,
        [
            newUser.id_usuario,
            tokenHash,
            req.ip,
            req.get('User-Agent'),
            expirationDate
        ]
    );

    // Auditar registro
    await auditAction(req, 'usuarios', 'INSERT', newUser.id_usuario, null, { correo: newUser.correo });

    res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
            usuario: newUser.toJSON(),
            tokens: {
                access_token: accessToken,
                refresh_token: refreshToken,
                expires_in: '24h'
            }
        }
    });
});

// Inicio de sesión
const login = asyncHandler(async (req, res) => {
    const { correo, password } = req.body;

    // Buscar usuario por correo
    const user = await Usuario.findByEmail(correo);
    
    if (!user) {
        throw createError(
            MENSAJES_ERROR.CREDENCIALES_INVALIDAS,
            HTTP_STATUS.UNAUTHORIZED,
            'INVALID_CREDENTIALS'
        );
    }

    // Verificar si el usuario está activo
    if (!user.activo) {
        throw createError(
            'Usuario inactivo',
            HTTP_STATUS.UNAUTHORIZED,
            'USER_INACTIVE'
        );
    }

    // Verificar si el usuario está bloqueado
    if (isUserLocked(user.bloqueado_hasta)) {
        throw createError(
            MENSAJES_ERROR.USUARIO_BLOQUEADO,
            HTTP_STATUS.UNAUTHORIZED,
            'USER_LOCKED'
        );
    }

    // Verificar contraseña
    const isValidPassword = await user.verifyPassword(password);
    
    if (!isValidPassword) {
        // Incrementar intentos fallidos
        await Usuario.incrementFailedAttempts(user.id_usuario);
        
        // Auditar intento fallido
        await auditAction(req, 'usuarios', 'LOGIN', user.id_usuario, null, { correo: user.correo, exito: false });
        
        throw createError(
            MENSAJES_ERROR.CREDENCIALES_INVALIDAS,
            HTTP_STATUS.UNAUTHORIZED,
            'INVALID_CREDENTIALS'
        );
    }

    // Resetear intentos fallidos en login exitoso
    await Usuario.resetFailedAttempts(user.id_usuario);

    // Generar tokens
    const tokenPayload = {
        id_usuario: user.id_usuario,
        correo: user.correo,
        roles: user.roles.map(role => role.nombre)
    };

    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Guardar sesión en base de datos
    const tokenHash = generateTokenHash(accessToken);
    const expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    await executeQuery(
        `INSERT INTO sesiones (id_usuario, token_hash, ip_address, user_agent, fecha_expiracion) 
         VALUES (?, ?, ?, ?, ?)`,
        [
            user.id_usuario,
            tokenHash,
            req.ip,
            req.get('User-Agent'),
            expirationDate
        ]
    );

    // Auditar login exitoso
    await auditAction(req, 'usuarios', 'LOGIN', user.id_usuario, null, { correo: user.correo, exito: true });

    res.json({
        success: true,
        message: MENSAJES_EXITO.LOGIN_EXITOSO,
        data: {
            usuario: user.toJSON(),
            tokens: {
                access_token: accessToken,
                refresh_token: refreshToken,
                expires_in: '24h'
            }
        }
    });
});

// Cierre de sesión
const logout = asyncHandler(async (req, res) => {
    const token = req.token;
    const userId = req.user.id_usuario;

    // Invalidar sesión en base de datos
    const tokenHash = generateTokenHash(token);
    await executeQuery(
        'UPDATE sesiones SET activo = FALSE WHERE token_hash = ?',
        [tokenHash]
    );

    // Auditar logout
    await auditAction(req, 'usuarios', 'LOGOUT', userId, null, null);

    res.json({
        success: true,
        message: MENSAJES_EXITO.LOGOUT_EXITOSO
    });
});

// Cerrar todas las sesiones
const logoutAll = asyncHandler(async (req, res) => {
    const userId = req.user.id_usuario;

    // Invalidar todas las sesiones del usuario
    await executeQuery(
        'UPDATE sesiones SET activo = FALSE WHERE id_usuario = ?',
        [userId]
    );

    // Auditar logout masivo
    await auditAction(req, 'usuarios', 'LOGOUT', userId, null, { tipo: 'logout_all' });

    res.json({
        success: true,
        message: 'Todas las sesiones han sido cerradas exitosamente'
    });
});

// Refrescar token
const refreshToken = asyncHandler(async (req, res) => {
    const { refresh_token } = req.body;

    if (!refresh_token) {
        throw createError(
            'Refresh token requerido',
            HTTP_STATUS.BAD_REQUEST,
            'REFRESH_TOKEN_REQUIRED'
        );
    }

    try {
        // Verificar refresh token
        const { verifyToken } = require('../config/auth');
        const decoded = verifyToken(refresh_token);

        if (decoded.type !== 'refresh') {
            throw createError(
                'Token de refresco inválido',
                HTTP_STATUS.UNAUTHORIZED,
                'INVALID_REFRESH_TOKEN'
            );
        }

        // Buscar usuario
        const user = await Usuario.findById(decoded.id_usuario);
        if (!user || !user.activo) {
            throw createError(
                'Usuario no encontrado o inactivo',
                HTTP_STATUS.UNAUTHORIZED,
                'USER_NOT_FOUND'
            );
        }

        // Generar nuevo access token
        const tokenPayload = {
            id_usuario: user.id_usuario,
            correo: user.correo,
            roles: user.roles.map(role => role.nombre)
        };

        const newAccessToken = generateToken(tokenPayload);
        const newRefreshToken = generateRefreshToken(tokenPayload);

        // Guardar nueva sesión
        const tokenHash = generateTokenHash(newAccessToken);
        const expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await executeQuery(
            `INSERT INTO sesiones (id_usuario, token_hash, ip_address, user_agent, fecha_expiracion) 
             VALUES (?, ?, ?, ?, ?)`,
            [
                user.id_usuario,
                tokenHash,
                req.ip,
                req.get('User-Agent'),
                expirationDate
            ]
        );

        res.json({
            success: true,
            message: 'Token refrescado exitosamente',
            data: {
                tokens: {
                    access_token: newAccessToken,
                    refresh_token: newRefreshToken,
                    expires_in: '24h'
                }
            }
        });
    } catch (error) {
        throw createError(
            'Token de refresco inválido o expirado',
            HTTP_STATUS.UNAUTHORIZED,
            'INVALID_REFRESH_TOKEN'
        );
    }
});

// Cambiar contraseña
const changePassword = asyncHandler(async (req, res) => {
    const { password_actual, password_nueva } = req.body;
    const userId = req.user.id_usuario;

    await Usuario.updatePassword(userId, password_actual, password_nueva);

    // Auditar cambio de contraseña
    await auditAction(req, 'usuarios', 'UPDATE', userId, null, { accion: 'cambio_password' });

    // Invalidar todas las sesiones excepto la actual
    const currentTokenHash = generateTokenHash(req.token);
    await executeQuery(
        'UPDATE sesiones SET activo = FALSE WHERE id_usuario = ? AND token_hash != ?',
        [userId, currentTokenHash]
    );

    res.json({
        success: true,
        message: MENSAJES_EXITO.PASSWORD_ACTUALIZADO
    });
});

// Obtener perfil del usuario actual
const getProfile = asyncHandler(async (req, res) => {
    const user = await Usuario.findById(req.user.id_usuario);
    
    if (!user) {
        throw createError(
            'Usuario no encontrado',
            HTTP_STATUS.NOT_FOUND,
            'USER_NOT_FOUND'
        );
    }

    let profileData = user.toJSON();
    const userRole = user.roles.length > 0 ? user.roles[0].nombre : null;

    // Obtener datos específicos según el rol
    if (userRole === 'estudiante') {
        const query = `
            SELECT 
                e.id_estudiante,
                e.nombre,
                e.apellido,
                e.ci,
                e.fecha_nacimiento,
                e.direccion,
                e.telefono,
                e.estado_academico,
                e.fecha_ingreso,
                m.nombre as mencion_nombre,
                m.id_mencion
            FROM estudiantes e
            LEFT JOIN menciones m ON e.id_mencion = m.id_mencion
            WHERE e.id_usuario = ?
        `;
        const [estudiante] = await executeQuery(query, [user.id_usuario]);
        if (estudiante) {
            profileData = { ...profileData, ...estudiante };
        }
    } 
    else if (userRole === 'docente') {
        const query = `
            SELECT 
                d.id_docente,
                d.nombre,
                d.apellido,
                d.ci,
                d.especialidad,
                d.telefono,
                d.activo,
                d.fecha_contratacion,
                COUNT(DISTINCT dm.id_materia) as materias_asignadas
            FROM docentes d
            LEFT JOIN docente_materias dm ON d.id_docente = dm.id_docente
            WHERE d.id_usuario = ?
            GROUP BY d.id_docente
        `;
        const [docente] = await executeQuery(query, [user.id_usuario]);
        if (docente) {
            profileData = { ...profileData, ...docente };
        }
    }
    // Para el rol admin, usar los datos básicos del usuario

    res.json({
        success: true,
        data: {
            usuario: profileData
        }
    });
});

// Verificar token (para validación de sesión)
const verifyToken = asyncHandler(async (req, res) => {
    res.json({
        success: true,
        message: 'Token válido',
        data: {
            usuario: req.user
        }
    });
});

// Obtener sesiones activas
const getActiveSessions = asyncHandler(async (req, res) => {
    const userId = req.user.id_usuario;

    const sessions = await executeQuery(
        `SELECT 
            id_sesion,
            ip_address,
            user_agent,
            fecha_creacion,
            fecha_expiracion,
            activo
         FROM sesiones 
         WHERE id_usuario = ? AND activo = TRUE AND fecha_expiracion > NOW()
         ORDER BY fecha_creacion DESC`,
        [userId]
    );

    res.json({
        success: true,
        data: {
            sesiones: sessions
        }
    });
});

// Cerrar sesión específica
const logoutSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user.id_usuario;

    // Verificar que la sesión pertenece al usuario
    const session = await executeQuery(
        'SELECT * FROM sesiones WHERE id_sesion = ? AND id_usuario = ?',
        [sessionId, userId]
    );

    if (session.length === 0) {
        throw createError(
            'Sesión no encontrada',
            HTTP_STATUS.NOT_FOUND,
            'SESSION_NOT_FOUND'
        );
    }

    // Invalidar sesión
    await executeQuery(
        'UPDATE sesiones SET activo = FALSE WHERE id_sesion = ?',
        [sessionId]
    );

    res.json({
        success: true,
        message: 'Sesión cerrada exitosamente'
    });
});

module.exports = {
    register,
    login,
    logout,
    logoutAll,
    refreshToken,
    changePassword,
    getProfile,
    verifyToken,
    getActiveSessions,
    logoutSession
};
