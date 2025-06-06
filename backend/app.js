const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { errorHandler } = require('./middleware/errorHandler');

// Importar rutas
const authRoutes = require('./routes/auth');
const estudiantesRoutes = require('./routes/estudiantes');
const docentesRoutes = require('./routes/docentes');
const materiasRoutes = require('./routes/materias');
const mencionesRoutes = require('./routes/menciones');
const inscripcionesRoutes = require('./routes/inscripciones');
const notasRoutes = require('./routes/notas');
const reportesRoutes = require('./routes/reportes');
const auditoriaRoutes = require('./routes/auditoria');
const tiposEvaluacionRoutes = require('./routes/tiposEvaluacion');
const prerequisitosRoutes = require('./routes/prerequisitos');
const horariosRoutes = require('./routes/horarios');

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/estudiantes', estudiantesRoutes);
app.use('/api/docentes', docentesRoutes);
app.use('/api/materias', materiasRoutes);
app.use('/api/menciones', mencionesRoutes);
app.use('/api/inscripciones', inscripcionesRoutes);
app.use('/api/notas', notasRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/auditoria', auditoriaRoutes);
app.use('/api/tipos-evaluacion', tiposEvaluacionRoutes);
app.use('/api/prerequisitos', prerequisitosRoutes);
app.use('/api/horarios', horariosRoutes);

// Manejo de errores
app.use(errorHandler);

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ message: 'API funcionando correctamente' });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
});

module.exports = app;
