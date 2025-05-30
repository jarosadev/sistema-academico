const jwt = require('jsonwebtoken');
require('dotenv').config();

// Configuración de autenticación
const authConfig = {
    jwtSecret: process.env.JWT_SECRET || 'academic_system_secret_key_2024',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
    lockoutTime: parseInt(process.env.LOCKOUT_TIME) || 15 // minutos
};

// Función para generar token JWT
const generateToken = (payload, expiresIn = authConfig.jwtExpiresIn) => {
    try {
        return jwt.sign(payload, authConfig.jwtSecret, { 
            expiresIn,
            issuer: 'academic-system',
            audience: 'users'
        });
    } catch (error) {
        throw new Error('Error al generar token: ' + error.message);
    }
};

// Función para verificar token JWT
const verifyToken = (token) => {
    try {
        return jwt.verify(token, authConfig.jwtSecret, {
            issuer: 'academic-system',
            audience: 'users'
        });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token expirado');
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error('Token inválido');
        } else {
            throw new Error('Error al verificar token: ' + error.message);
        }
    }
};

// Función para generar refresh token
const generateRefreshToken = (payload) => {
    try {
        return jwt.sign(
            { ...payload, type: 'refresh' }, 
            authConfig.jwtSecret, 
            { 
                expiresIn: authConfig.jwtRefreshExpiresIn,
                issuer: 'academic-system',
                audience: 'users'
            }
        );
    } catch (error) {
        throw new Error('Error al generar refresh token: ' + error.message);
    }
};

// Función para decodificar token sin verificar (para obtener información)
const decodeToken = (token) => {
    try {
        return jwt.decode(token);
    } catch (error) {
        throw new Error('Error al decodificar token: ' + error.message);
    }
};

// Función para generar hash del token (para almacenar en BD)
const generateTokenHash = (token) => {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(token).digest('hex');
};

// Función para validar formato de email
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Función para validar fortaleza de contraseña
const validatePassword = (password) => {
    // Mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};

// Función para generar contraseña temporal
const generateTemporaryPassword = (length = 12) => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$!%*?&';
    let password = '';
    
    // Asegurar al menos un carácter de cada tipo
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // minúscula
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // mayúscula
    password += '0123456789'[Math.floor(Math.random() * 10)]; // número
    password += '@$!%*?&'[Math.floor(Math.random() * 7)]; // símbolo
    
    // Completar el resto de la longitud
    for (let i = password.length; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Mezclar los caracteres
    return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Función para calcular tiempo de bloqueo
const calculateLockoutTime = () => {
    return new Date(Date.now() + (authConfig.lockoutTime * 60 * 1000));
};

// Función para verificar si un usuario está bloqueado
const isUserLocked = (bloqueadoHasta) => {
    if (!bloqueadoHasta) return false;
    return new Date() < new Date(bloqueadoHasta);
};

// Roles del sistema
const roles = {
    ADMINISTRADOR: 'administrador',
    ESTUDIANTE: 'estudiante',
    DOCENTE: 'docente'
};

// Permisos por rol
const permissions = {
    [roles.ADMINISTRADOR]: [
        'usuarios:crear',
        'usuarios:leer',
        'usuarios:actualizar',
        'usuarios:eliminar',
        'estudiantes:crear',
        'estudiantes:leer',
        'estudiantes:actualizar',
        'estudiantes:eliminar',
        'docentes:crear',
        'docentes:leer',
        'docentes:actualizar',
        'docentes:eliminar',
        'materias:crear',
        'materias:leer',
        'materias:actualizar',
        'materias:eliminar',
        'menciones:crear',
        'menciones:leer',
        'menciones:actualizar',
        'menciones:eliminar',
        'inscripciones:crear',
        'inscripciones:leer',
        'inscripciones:actualizar',
        'inscripciones:eliminar',
        'notas:crear',
        'notas:leer',
        'notas:actualizar',
        'notas:eliminar',
        'reportes:generar',
        'auditoria:leer'
    ],
    [roles.DOCENTE]: [
        'estudiantes:leer',
        'materias:leer',
        'inscripciones:leer',
        'notas:crear',
        'notas:leer',
        'notas:actualizar',
        'reportes:generar'
    ],
    [roles.ESTUDIANTE]: [
        'materias:leer',
        'inscripciones:crear',
        'inscripciones:leer',
        'notas:leer',
        'historial:leer'
    ]
};

// Función para verificar permisos
const hasPermission = (userRoles, requiredPermission) => {
    if (!userRoles || !Array.isArray(userRoles)) return false;
    
    for (const role of userRoles) {
        const rolePermissions = permissions[role.nombre] || [];
        if (rolePermissions.includes(requiredPermission)) {
            return true;
        }
    }
    
    return false;
};

module.exports = {
    authConfig,
    generateToken,
    verifyToken,
    generateRefreshToken,
    decodeToken,
    generateTokenHash,
    validateEmail,
    validatePassword,
    generateTemporaryPassword,
    calculateLockoutTime,
    isUserLocked,
    roles,
    permissions,
    hasPermission
};
