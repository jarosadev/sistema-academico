const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Importar configuración de base de datos
const { testConnection, initializeDatabase } = require('./config/database');

// Importar middlewares personalizados
const { errorHandler } = require('./middleware/errorHandler');

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
    windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
    max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
    message: {
        error: 'Demasiadas solicitudes desde esta IP, intente nuevamente más tarde.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false
});

app.use(limiter);

// Middleware de compresión
app.use(compression());

// Middleware de logging
app.use(morgan('dev'));

// Middleware para parsing de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ruta de salud
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Servidor de pruebas funcionando correctamente',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'test',
        port: PORT
    });
});

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'API de pruebas funcionando correctamente',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'test',
        port: PORT
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

// Middleware de manejo de errores
app.use(errorHandler);

// Configuración del puerto (forzar puerto específico para pruebas)
const PORT = 3002;

// Función para inicializar el servidor
const initializeServer = async () => {
    try {
        console.log('🔧 Iniciando servidor de pruebas...');
        
        // Probar conexión a base de datos
        console.log('📊 Probando conexión a base de datos...');
        const dbConnected = await testConnection();
        
        if (!dbConnected) {
            console.log('⚠️  Continuando sin conexión a base de datos para pruebas básicas');
        } else {
            console.log('✅ Conexión a base de datos exitosa');
            
            // Intentar inicializar base de datos
            try {
                await initializeDatabase();
                console.log('✅ Base de datos inicializada correctamente');
            } catch (dbError) {
                console.log('⚠️  Error al inicializar base de datos:', dbError.message);
                console.log('⚠️  Continuando con pruebas básicas...');
            }
        }
        
        // Iniciar servidor
        const server = app.listen(PORT, () => {
            console.log(`🚀 Servidor de pruebas iniciado exitosamente`);
            console.log(`📍 Puerto: ${PORT}`);
            console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'test'}`);
            console.log(`⏰ Hora de inicio: ${new Date().toLocaleString()}`);
            console.log(`🔗 URL: http://localhost:${PORT}`);
            console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
            console.log(`🔗 API Health: http://localhost:${PORT}/api/health`);
        });

        // Manejo de cierre graceful
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

        return server;
    } catch (error) {
        console.error('❌ Error al inicializar servidor:', error.message);
        process.exit(1);
    }
};

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Error no capturado:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesa rechazada no manejada:', reason);
    process.exit(1);
});

// Inicializar servidor si se ejecuta directamente
if (require.main === module) {
    initializeServer();
}

module.exports = app;
