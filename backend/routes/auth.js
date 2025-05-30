const express = require('express');
const router = express.Router();

// Importar controladores
const authController = require('../controllers/authController');

// Importar middlewares
const { authenticateToken } = require('../middleware/auth');
const { validate, validateParams, userSchemas, idParamSchema } = require('../middleware/validation');

/**
 * @route   POST /api/auth/register
 * @desc    Registrar nuevo usuario
 * @access  Public (pero requiere roles válidos)
 */
router.post('/register', 
    validate(userSchemas.register),
    authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión
 * @access  Public
 */
router.post('/login',
    validate(userSchemas.login),
    authController.login
);

/**
 * @route   POST /api/auth/logout
 * @desc    Cerrar sesión actual
 * @access  Private
 */
router.post('/logout',
    authenticateToken,
    authController.logout
);

/**
 * @route   POST /api/auth/logout-all
 * @desc    Cerrar todas las sesiones del usuario
 * @access  Private
 */
router.post('/logout-all',
    authenticateToken,
    authController.logoutAll
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refrescar token de acceso
 * @access  Public
 */
router.post('/refresh',
    authController.refreshToken
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Cambiar contraseña del usuario actual
 * @access  Private
 */
router.put('/change-password',
    authenticateToken,
    validate(userSchemas.updatePassword),
    authController.changePassword
);

/**
 * @route   GET /api/auth/profile
 * @desc    Obtener perfil del usuario actual
 * @access  Private
 */
router.get('/profile',
    authenticateToken,
    authController.getProfile
);

/**
 * @route   GET /api/auth/verify
 * @desc    Verificar validez del token
 * @access  Private
 */
router.get('/verify',
    authenticateToken,
    authController.verifyToken
);

/**
 * @route   GET /api/auth/sessions
 * @desc    Obtener sesiones activas del usuario
 * @access  Private
 */
router.get('/sessions',
    authenticateToken,
    authController.getActiveSessions
);

/**
 * @route   DELETE /api/auth/sessions/:sessionId
 * @desc    Cerrar sesión específica
 * @access  Private
 */
router.delete('/sessions/:sessionId',
    authenticateToken,
    validateParams(idParamSchema.keys({ sessionId: idParamSchema.extract('id') })),
    authController.logoutSession
);

module.exports = router;
