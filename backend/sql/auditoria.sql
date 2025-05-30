-- Tabla de auditoría para el sistema académico
-- Esta tabla registra todas las acciones importantes realizadas en el sistema

CREATE TABLE IF NOT EXISTS auditoria (
    id_auditoria INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NULL,
    tabla_afectada VARCHAR(50) NOT NULL,
    accion ENUM('INSERT', 'UPDATE', 'DELETE', 'SELECT', 'LOGIN', 'LOGOUT', 'EXPORT') NOT NULL,
    id_registro INT NULL,
    valores_anteriores JSON NULL,
    valores_nuevos JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices para mejorar el rendimiento
    INDEX idx_usuario (id_usuario),
    INDEX idx_tabla (tabla_afectada),
    INDEX idx_accion (accion),
    INDEX idx_fecha (fecha_accion),
    INDEX idx_tabla_accion (tabla_afectada, accion),
    
    -- Clave foránea opcional (puede ser NULL para acciones del sistema)
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
);

-- Comentarios para documentación
ALTER TABLE auditoria COMMENT = 'Tabla de auditoría para registrar todas las acciones del sistema';
ALTER TABLE auditoria MODIFY COLUMN id_auditoria INT AUTO_INCREMENT COMMENT 'ID único de la entrada de auditoría';
ALTER TABLE auditoria MODIFY COLUMN id_usuario INT NULL COMMENT 'ID del usuario que realizó la acción (NULL para acciones del sistema)';
ALTER TABLE auditoria MODIFY COLUMN tabla_afectada VARCHAR(50) NOT NULL COMMENT 'Nombre de la tabla afectada por la acción';
ALTER TABLE auditoria MODIFY COLUMN accion ENUM('INSERT', 'UPDATE', 'DELETE', 'SELECT', 'LOGIN', 'LOGOUT', 'EXPORT') NOT NULL COMMENT 'Tipo de acción realizada';
ALTER TABLE auditoria MODIFY COLUMN id_registro INT NULL COMMENT 'ID del registro específico afectado (si aplica)';
ALTER TABLE auditoria MODIFY COLUMN valores_anteriores JSON NULL COMMENT 'Valores antes del cambio (para UPDATE y DELETE)';
ALTER TABLE auditoria MODIFY COLUMN valores_nuevos JSON NULL COMMENT 'Valores después del cambio (para INSERT y UPDATE)';
ALTER TABLE auditoria MODIFY COLUMN ip_address VARCHAR(45) NULL COMMENT 'Dirección IP desde donde se realizó la acción';
ALTER TABLE auditoria MODIFY COLUMN user_agent TEXT NULL COMMENT 'User Agent del navegador/cliente';
ALTER TABLE auditoria MODIFY COLUMN fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la acción';

-- Insertar algunos registros de ejemplo para pruebas
INSERT INTO auditoria (id_usuario, tabla_afectada, accion, valores_nuevos, ip_address, user_agent) VALUES
(1, 'sistema', 'LOGIN', JSON_OBJECT('mensaje', 'Inicio de sesión del administrador'), '127.0.0.1', 'Sistema de Auditoría'),
(NULL, 'sistema', 'INSERT', JSON_OBJECT('mensaje', 'Inicialización del sistema de auditoría'), '127.0.0.1', 'Sistema');

-- Crear vista para consultas frecuentes de auditoría
CREATE OR REPLACE VIEW vista_auditoria_detallada AS
SELECT 
    a.id_auditoria,
    a.tabla_afectada,
    a.accion,
    a.id_registro,
    a.fecha_accion,
    a.ip_address,
    u.correo as usuario_correo,
    CASE 
        WHEN e.id_estudiante IS NOT NULL THEN CONCAT(e.nombre, ' ', e.apellido)
        WHEN d.id_docente IS NOT NULL THEN CONCAT(d.nombre, ' ', d.apellido)
        WHEN u.id_usuario IS NOT NULL THEN 'Usuario del sistema'
        ELSE 'Sistema'
    END as usuario_nombre,
    CASE 
        WHEN e.id_estudiante IS NOT NULL THEN 'Estudiante'
        WHEN d.id_docente IS NOT NULL THEN 'Docente'
        WHEN u.id_usuario IS NOT NULL THEN 'Usuario'
        ELSE 'Sistema'
    END as tipo_usuario
FROM auditoria a
LEFT JOIN usuarios u ON a.id_usuario = u.id_usuario
LEFT JOIN estudiantes e ON u.id_usuario = e.id_usuario
LEFT JOIN docentes d ON u.id_usuario = d.id_usuario
ORDER BY a.fecha_accion DESC;

-- Procedimiento almacenado para limpiar logs antiguos
DELIMITER //
CREATE PROCEDURE LimpiarAuditoriaAntigua(IN dias_antiguedad INT)
BEGIN
    DECLARE registros_eliminados INT DEFAULT 0;
    
    -- Validar que no se eliminen logs muy recientes
    IF dias_antiguedad < 30 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se pueden eliminar logs con menos de 30 días de antigüedad';
    END IF;
    
    -- Eliminar registros antiguos
    DELETE FROM auditoria 
    WHERE fecha_accion < DATE_SUB(NOW(), INTERVAL dias_antiguedad DAY);
    
    -- Obtener número de registros eliminados
    SET registros_eliminados = ROW_COUNT();
    
    -- Registrar la limpieza en la auditoría
    INSERT INTO auditoria (tabla_afectada, accion, valores_nuevos, ip_address, user_agent)
    VALUES ('auditoria', 'DELETE', 
            JSON_OBJECT('registros_eliminados', registros_eliminados, 'dias_antiguedad', dias_antiguedad),
            '127.0.0.1', 'Procedimiento de limpieza automática');
    
    -- Retornar resultado
    SELECT registros_eliminados as registros_eliminados;
END //
DELIMITER ;

-- Función para obtener estadísticas de auditoría
DELIMITER //
CREATE FUNCTION ObtenerEstadisticasAuditoria(fecha_inicio DATE, fecha_fin DATE)
RETURNS JSON
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE resultado JSON;
    
    SELECT JSON_OBJECT(
        'total_acciones', COUNT(*),
        'acciones_por_tipo', (
            SELECT JSON_OBJECTAGG(accion, cantidad)
            FROM (
                SELECT accion, COUNT(*) as cantidad
                FROM auditoria 
                WHERE fecha_accion BETWEEN fecha_inicio AND fecha_fin
                GROUP BY accion
            ) as subquery
        ),
        'usuarios_mas_activos', (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT('usuario', usuario_correo, 'acciones', cantidad)
            )
            FROM (
                SELECT u.correo as usuario_correo, COUNT(*) as cantidad
                FROM auditoria a
                JOIN usuarios u ON a.id_usuario = u.id_usuario
                WHERE a.fecha_accion BETWEEN fecha_inicio AND fecha_fin
                GROUP BY u.id_usuario
                ORDER BY cantidad DESC
                LIMIT 5
            ) as subquery2
        )
    ) INTO resultado
    FROM auditoria
    WHERE fecha_accion BETWEEN fecha_inicio AND fecha_fin;
    
    RETURN resultado;
END //
DELIMITER ;

-- Trigger para auditar cambios en la tabla usuarios (ejemplo)
DELIMITER //
CREATE TRIGGER auditoria_usuarios_update
AFTER UPDATE ON usuarios
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (
        id_usuario, tabla_afectada, accion, id_registro,
        valores_anteriores, valores_nuevos, ip_address, user_agent
    ) VALUES (
        NEW.id_usuario, 'usuarios', 'UPDATE', NEW.id_usuario,
        JSON_OBJECT(
            'correo', OLD.correo,
            'activo', OLD.activo,
            'ultimo_acceso', OLD.ultimo_acceso
        ),
        JSON_OBJECT(
            'correo', NEW.correo,
            'activo', NEW.activo,
            'ultimo_acceso', NEW.ultimo_acceso
        ),
        '127.0.0.1', 'Trigger automático'
    );
END //
DELIMITER ;

-- Crear índices adicionales para optimizar consultas frecuentes
CREATE INDEX idx_auditoria_usuario_fecha ON auditoria(id_usuario, fecha_accion);
CREATE INDEX idx_auditoria_tabla_fecha ON auditoria(tabla_afectada, fecha_accion);
CREATE INDEX idx_auditoria_accion_fecha ON auditoria(accion, fecha_accion);

-- Comentario final
SELECT 'Sistema de auditoría instalado correctamente' as mensaje;
