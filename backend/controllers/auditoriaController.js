const { 
    obtenerLogsAuditoria, 
    obtenerEstadisticasAuditoria, 
    limpiarLogsAntiguos 
} = require('../middleware/audit-complete');

/**
 * Controlador para gestión de auditoría
 */

/**
 * Obtener logs de auditoría con filtros
 */
const getLogs = async (req, res) => {
    try {
        const filtros = {
            id_usuario: req.query.id_usuario,
            tabla: req.query.tabla,
            accion: req.query.accion,
            fecha_inicio: req.query.fecha_inicio,
            fecha_fin: req.query.fecha_fin,
            page: req.query.page || 1,
            limit: req.query.limit || 50
        };

        const resultado = await obtenerLogsAuditoria(filtros);
        
        res.json(resultado);

    } catch (error) {
        console.error('Error obteniendo logs de auditoría:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Obtener estadísticas de auditoría
 */
const getEstadisticas = async (req, res) => {
    try {
        const filtros = {
            fecha_inicio: req.query.fecha_inicio,
            fecha_fin: req.query.fecha_fin
        };

        const resultado = await obtenerEstadisticasAuditoria(filtros);
        
        res.json(resultado);

    } catch (error) {
        console.error('Error obteniendo estadísticas de auditoría:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Limpiar logs antiguos de auditoría
 */
const limpiarLogs = async (req, res) => {
    try {
        const { dias = 90 } = req.body;

        // Validar que solo administradores puedan limpiar logs
        if (req.user.rol !== 'administrador') {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para realizar esta acción'
            });
        }

        // Validar días mínimos
        if (dias < 30) {
            return res.status(400).json({
                success: false,
                message: 'No se pueden eliminar logs con menos de 30 días de antigüedad'
            });
        }

        const resultado = await limpiarLogsAntiguos(dias);
        
        res.json(resultado);

    } catch (error) {
        console.error('Error limpiando logs de auditoría:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Obtener resumen de actividad reciente
 */
const getActividadReciente = async (req, res) => {
    try {
        const { limit = 20 } = req.query;

        // Obtener logs recientes
        const filtros = {
            page: 1,
            limit: parseInt(limit)
        };

        const resultado = await obtenerLogsAuditoria(filtros);
        
        res.json({
            success: true,
            data: resultado.data,
            message: `Últimas ${resultado.data.length} actividades del sistema`
        });

    } catch (error) {
        console.error('Error obteniendo actividad reciente:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Obtener logs por usuario específico
 */
const getLogsPorUsuario = async (req, res) => {
    try {
        const { id_usuario } = req.params;
        const { page = 1, limit = 50 } = req.query;

        const filtros = {
            id_usuario,
            page,
            limit
        };

        const resultado = await obtenerLogsAuditoria(filtros);
        
        res.json(resultado);

    } catch (error) {
        console.error('Error obteniendo logs por usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Obtener logs por tabla específica
 */
const getLogsPorTabla = async (req, res) => {
    try {
        const { tabla } = req.params;
        const { page = 1, limit = 50 } = req.query;

        const filtros = {
            tabla,
            page,
            limit
        };

        const resultado = await obtenerLogsAuditoria(filtros);
        
        res.json(resultado);

    } catch (error) {
        console.error('Error obteniendo logs por tabla:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Exportar logs en formato CSV
 */
const exportarLogs = async (req, res) => {
    try {
        const filtros = {
            id_usuario: req.query.id_usuario,
            tabla: req.query.tabla,
            accion: req.query.accion,
            fecha_inicio: req.query.fecha_inicio,
            fecha_fin: req.query.fecha_fin,
            limit: 10000 // Límite alto para exportación
        };

        const resultado = await obtenerLogsAuditoria(filtros);
        
        // Función para escapar valores CSV
        const escapeCsvValue = (value) => {
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        };

        // Función para formatear objetos JSON
        const formatJsonValue = (value) => {
            if (!value) return '';
            try {
                const objString = typeof value === 'string' ? value : JSON.stringify(value);
                return objString.replace(/"/g, '""').replace(/\n/g, ' ');
            } catch (e) {
                return '';
            }
        };

        // Convertir a CSV
        const logs = resultado.data;
        const csvRows = [];
        
        // Headers
        csvRows.push([
            'Fecha',
            'Usuario',
            'Acción',
            'Tabla',
            'ID Registro',
            'Valores Anteriores',
            'Valores Nuevos',
            'IP',
            'User Agent'
        ].map(escapeCsvValue).join(','));
        
        // Data
        logs.forEach(log => {
            csvRows.push([
                new Date(log.fecha_accion).toLocaleString(),
                log.usuario_nombre || 'Sistema',
                log.accion,
                log.tabla_afectada,
                log.id_registro || '',
                formatJsonValue(log.valores_anteriores),
                formatJsonValue(log.valores_nuevos),
                log.ip_address,
                log.user_agent
            ].map(escapeCsvValue).join(','));
        });

        const csvContent = csvRows.join('\r\n');
        
        // Configurar headers para descarga con codificación UTF-8
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=auditoria_${new Date().toISOString().split('T')[0]}.csv`);
        
        // Agregar BOM para Excel y enviar
        const BOM = '\uFEFF';
        res.send(BOM + csvContent);

    } catch (error) {
        console.error('Error exportando logs:', error);
        res.status(500).json({
            success: false,
            message: 'Error exportando logs',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    getLogs,
    getEstadisticas,
    limpiarLogs,
    getActividadReciente,
    getLogsPorUsuario,
    getLogsPorTabla,
    exportarLogs
};
