const { executeQuery } = require('../config/database');

/**
 * Middleware y funciones para auditoría del sistema
 */

/**
 * Registra una acción de auditoría en la base de datos
 * @param {Object} req - Request object (para obtener información del usuario)
 * @param {string} tabla - Tabla afectada
 * @param {string} accion - Tipo de acción (INSERT, UPDATE, DELETE, SELECT, etc.)
 * @param {number|null} id_registro - ID del registro afectado
 * @param {Object|null} valores_anteriores - Valores antes del cambio
 * @param {Object|null} valores_nuevos - Valores después del cambio
 */
async function auditAction(req, tabla, accion, id_registro = null, valores_anteriores = null, valores_nuevos = null) {
    try {
        // Obtener información del usuario desde el token
        const id_usuario = req.user?.id_usuario || null;
        const ip_address = req.ip || req.connection.remoteAddress || 'unknown';
        const user_agent = req.get('User-Agent') || 'unknown';
        
        // Preparar datos para insertar
        const query = `
            INSERT INTO auditoria (
                id_usuario, tabla_afectada, accion, id_registro,
                valores_anteriores, valores_nuevos, ip_address, user_agent
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            id_usuario,
            tabla,
            accion,
            id_registro,
            valores_anteriores ? JSON.stringify(valores_anteriores) : null,
            valores_nuevos ? JSON.stringify(valores_nuevos) : null,
            ip_address,
            user_agent
        ];

        await executeQuery(query, params);

    } catch (error) {
        // No lanzar error para no interrumpir la operación principal
        console.error('Error al registrar auditoría:', error);
    }
}

/**
 * Middleware para auditar automáticamente las requests
 */
function auditMiddleware(req, res, next) {
    // Guardar el método original de res.json para interceptarlo
    const originalJson = res.json;
    
    res.json = function(data) {
        // Solo auditar si la operación fue exitosa
        if (data && data.success) {
            // Determinar el tipo de acción basado en el método HTTP
            let accion = '';
            switch (req.method) {
                case 'GET':
                    accion = 'SELECT';
                    break;
                case 'POST':
                    accion = 'INSERT';
                    break;
                case 'PUT':
                case 'PATCH':
                    accion = 'UPDATE';
                    break;
                case 'DELETE':
                    accion = 'DELETE';
                    break;
                default:
                    accion = req.method;
            }

            // Intentar extraer información de la tabla desde la URL
            const urlParts = req.originalUrl.split('/');
            const tabla = urlParts[2] || 'unknown'; // Asumiendo /api/tabla/...

            // Auditar la acción (sin await para no bloquear la respuesta)
            auditAction(req, tabla, accion, null, null, {
                url: req.originalUrl,
                method: req.method,
                body: req.body
            }).catch(err => {
                console.error('Error en auditoría automática:', err);
            });
        }

        // Llamar al método original
        return originalJson.call(this, data);
    };

    next();
}

/**
 * Obtener logs de auditoría con filtros
 */
async function obtenerLogsAuditoria(filtros = {}) {
    try {
        const {
            id_usuario = '',
            tabla = '',
            accion = '',
            fecha_inicio = '',
            fecha_fin = '',
            page = 1,
            limit = 50
        } = filtros;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = Math.min(parseInt(limit), 100);

        // Construir condiciones WHERE
        let whereConditions = ['1=1'];
        let queryParams = [];

        if (id_usuario) {
            whereConditions.push('a.id_usuario = ?');
            queryParams.push(id_usuario);
        }

        if (tabla) {
            whereConditions.push('a.tabla_afectada LIKE ?');
            queryParams.push(`%${tabla}%`);
        }

        if (accion) {
            whereConditions.push('a.accion = ?');
            queryParams.push(accion);
        }

        if (fecha_inicio) {
            whereConditions.push('a.fecha_accion >= ?');
            queryParams.push(fecha_inicio);
        }

        if (fecha_fin) {
            whereConditions.push('a.fecha_accion <= ?');
            queryParams.push(fecha_fin + ' 23:59:59');
        }

        const whereClause = whereConditions.join(' AND ');

        // Consulta principal
        const query = `
            SELECT 
                a.*,
                u.correo as usuario_correo,
                CASE 
                    WHEN e.id_estudiante IS NOT NULL THEN CONCAT(e.nombre, ' ', e.apellido)
                    WHEN d.id_docente IS NOT NULL THEN CONCAT(d.nombre, ' ', d.apellido)
                    ELSE 'Usuario del sistema'
                END as usuario_nombre
            FROM auditoria a
            LEFT JOIN usuarios u ON a.id_usuario = u.id_usuario
            LEFT JOIN estudiantes e ON u.id_usuario = e.id_usuario
            LEFT JOIN docentes d ON u.id_usuario = d.id_usuario
            WHERE ${whereClause}
            ORDER BY a.fecha_accion DESC
            LIMIT ${limitNum} OFFSET ${offset}
        `;

        // Consulta para contar total
        const countQuery = `
            SELECT COUNT(*) as total
            FROM auditoria a
            WHERE ${whereClause}
        `;

        const [logs, countResult] = await Promise.all([
            executeQuery(query, queryParams),
            executeQuery(countQuery, queryParams)
        ]);

        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limitNum);

        return {
            success: true,
            data: logs.map(log => ({
                ...log,
                valores_anteriores: log.valores_anteriores ? JSON.parse(log.valores_anteriores) : null,
                valores_nuevos: log.valores_nuevos ? JSON.parse(log.valores_nuevos) : null
            })),
            pagination: {
                page: parseInt(page),
                limit: limitNum,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };

    } catch (error) {
        throw error;
    }
}

/**
 * Obtener estadísticas de auditoría
 */
async function obtenerEstadisticasAuditoria(filtros = {}) {
    try {
        const { fecha_inicio = '', fecha_fin = '' } = filtros;

        let whereConditions = ['1=1'];
        let queryParams = [];

        if (fecha_inicio) {
            whereConditions.push('fecha_accion >= ?');
            queryParams.push(fecha_inicio);
        }

        if (fecha_fin) {
            whereConditions.push('fecha_accion <= ?');
            queryParams.push(fecha_fin + ' 23:59:59');
        }

        const whereClause = whereConditions.join(' AND ');

        // Estadísticas por acción
        const accionesQuery = `
            SELECT 
                accion,
                COUNT(*) as cantidad
            FROM auditoria
            WHERE ${whereClause}
            GROUP BY accion
            ORDER BY cantidad DESC
        `;

        // Estadísticas por tabla
        const tablasQuery = `
            SELECT 
                tabla_afectada,
                COUNT(*) as cantidad
            FROM auditoria
            WHERE ${whereClause}
            GROUP BY tabla_afectada
            ORDER BY cantidad DESC
            LIMIT 10
        `;

        // Actividad por día
        const actividadQuery = `
            SELECT 
                DATE(fecha_accion) as fecha,
                COUNT(*) as cantidad
            FROM auditoria
            WHERE ${whereClause}
            GROUP BY DATE(fecha_accion)
            ORDER BY fecha DESC
            LIMIT 30
        `;

        // Usuarios más activos
        const usuariosQuery = `
            SELECT 
                u.correo,
                CASE 
                    WHEN e.id_estudiante IS NOT NULL THEN CONCAT(e.nombre, ' ', e.apellido)
                    WHEN d.id_docente IS NOT NULL THEN CONCAT(d.nombre, ' ', d.apellido)
                    ELSE 'Usuario del sistema'
                END as nombre_completo,
                COUNT(*) as cantidad_acciones
            FROM auditoria a
            LEFT JOIN usuarios u ON a.id_usuario = u.id_usuario
            LEFT JOIN estudiantes e ON u.id_usuario = e.id_usuario
            LEFT JOIN docentes d ON u.id_usuario = d.id_usuario
            WHERE ${whereClause} AND a.id_usuario IS NOT NULL
            GROUP BY a.id_usuario
            ORDER BY cantidad_acciones DESC
            LIMIT 10
        `;

        const [acciones, tablas, actividad, usuarios] = await Promise.all([
            executeQuery(accionesQuery, queryParams),
            executeQuery(tablasQuery, queryParams),
            executeQuery(actividadQuery, queryParams),
            executeQuery(usuariosQuery, queryParams)
        ]);

        return {
            success: true,
            data: {
                por_accion: acciones,
                por_tabla: tablas,
                actividad_diaria: actividad,
                usuarios_mas_activos: usuarios
            }
        };

    } catch (error) {
        throw error;
    }
}

/**
 * Limpiar logs antiguos de auditoría
 */
async function limpiarLogsAntiguos(diasAntiguedad = 90) {
    try {
        const query = `
            DELETE FROM auditoria 
            WHERE fecha_accion < DATE_SUB(NOW(), INTERVAL ? DAY)
        `;

        const result = await executeQuery(query, [diasAntiguedad]);

        return {
            success: true,
            message: `Se eliminaron ${result.affectedRows} registros de auditoría`,
            registros_eliminados: result.affectedRows
        };

    } catch (error) {
        throw error;
    }
}

module.exports = {
    auditAction,
    auditMiddleware,
    obtenerLogsAuditoria,
    obtenerEstadisticasAuditoria,
    limpiarLogsAntiguos
};
