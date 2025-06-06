const express = require('express');
const router = express.Router();

// Importar rutas específicas
const authRoutes = require('./auth');
const mencionRoutes = require('./menciones');
const estudianteRoutes = require('./estudiantes');
const docenteRoutes = require('./docentes');
const materiaRoutes = require('./materias');
const inscripcionRoutes = require('./inscripciones');
const notaRoutes = require('./notas');
const reporteRoutes = require('./reportes');
const auditoriaRoutes = require('./auditoria-fixed');
const tiposEvaluacionRoutes = require('./tiposEvaluacion');
const prerequisitosRoutes = require('./prerequisitos');
const horariosRoutes = require('./horarios');

// Middleware para logging de rutas en desarrollo
if (process.env.NODE_ENV === 'development') {
    router.use((req, res, next) => {
        console.log(`📍 ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
        next();
    });
}

// Ruta de información de la API
router.get('/', (req, res) => {
    res.json({
        message: 'API del Sistema Académico',
        version: '1.0.0',
        description: 'Sistema de gestión académica universitaria',
        endpoints: {
            auth: '/api/auth',
            usuarios: '/api/usuarios',
            estudiantes: '/api/estudiantes',
            docentes: '/api/docentes',
            menciones: '/api/menciones',
            materias: '/api/materias',
            inscripciones: '/api/inscripciones',
            notas: '/api/notas',
            historial: '/api/historial',
            reportes: '/api/reportes',
            auditoria: '/api/auditoria',
            tiposEvaluacion: '/api/tipos-evaluacion',
            prerequisitos: '/api/prerequisitos',
            horarios: '/api/horarios',
            health: '/api/health'
        },
        health: '/health',
        timestamp: new Date().toISOString()
    });
});

// Configurar rutas principales
router.use('/auth', authRoutes);
router.use('/menciones', mencionRoutes);
router.use('/estudiantes', estudianteRoutes);
router.use('/docentes', docenteRoutes);
router.use('/materias', materiaRoutes);
router.use('/inscripciones', inscripcionRoutes);
router.use('/notas', notaRoutes);
router.use('/reportes', reporteRoutes);
router.use('/auditoria', auditoriaRoutes);
router.use('/tipos-evaluacion', tiposEvaluacionRoutes);
router.use('/prerequisitos', prerequisitosRoutes);
router.use('/horarios', horariosRoutes);

// Ruta para estadísticas generales de la API
router.get('/stats', (req, res) => {
    res.json({
        message: 'Estadísticas de la API',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        version: process.version
    });
});

// Middleware para manejar rutas no encontradas dentro de /api
router.use('*', (req, res) => {
    res.status(404).json({
        error: true,
        message: `Endpoint de API no encontrado: ${req.originalUrl}`,
        code: 'API_ENDPOINT_NOT_FOUND',
        availableEndpoints: [
            '/api/auth',
            '/api/usuarios',
            '/api/estudiantes',
            '/api/docentes',
            '/api/menciones',
            '/api/materias',
            '/api/inscripciones',
            '/api/notas',
            '/api/historial',
            '/api/reportes',
            '/api/auditoria',
            '/api/tipos-evaluacion',
            '/api/prerequisitos',
            '/api/horarios'
        ],
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
