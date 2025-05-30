const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Importar middlewares personalizados
const { errorHandler } = require('./middleware/errorHandler');
const { auditMiddleware } = require('./middleware/audit-complete');

// Importar rutas
const routes = require('./routes');

// Crear aplicación Express
const app = express();

// Configuración de seguridad
app.use(helmet());

// Configuración de CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configuración de Rate Limiting
const limiter = rateLimit({
    windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutos por defecto
    max: process.env.RATE_LIMIT_MAX_REQUESTS || 100, // límite de requests por ventana de tiempo
    message: {
        error: 'Demasiadas solicitudes desde esta IP, intente nuevamente más tarde.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// app.use(limiter);

// Middleware de compresión
app.use(compression());

// Middleware de logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Middleware para parsing de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de auditoría
app.use(auditMiddleware);
// Ruta de salud también en /api/health para compatibilidad
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Servidor del Sistema Académico funcionando correctamente',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});
// Ruta de salud del servidor (también disponible en /api/health)
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Servidor del Sistema Académico funcionando correctamente',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// Rutas principales de la API
app.use('/api', routes);




// Ruta para manejar endpoints no encontrados
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint no encontrado',
        message: `La ruta ${req.originalUrl} no existe en este servidor`,
        code: 'ENDPOINT_NOT_FOUND'
    });
});

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

// Configuración del puerto
const PORT = process.env.PORT || 3000;

// Iniciar servidor
const server = app.listen(PORT, () => {
    console.log(`🚀 Servidor del Sistema Académico iniciado`);
    console.log(`📍 Puerto: ${PORT}`);
    console.log(`🌍 Entorno: ${process.env.NODE_ENV}`);
    console.log(`⏰ Hora de inicio: ${new Date().toLocaleString()}`);
});

// Manejo de cierre graceful del servidor
process.on('SIGTERM', () => {
    console.log('🛑 Señal SIGTERM recibida, cerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 Señal SIGINT recibida, cerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
    });
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Error no capturado:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesa rechazada no manejada:', reason);
    process.exit(1);
});

module.exports = app;
