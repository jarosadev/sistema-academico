-- Tabla de auditoría simplificada para el sistema académico

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
    
    INDEX idx_usuario (id_usuario),
    INDEX idx_tabla (tabla_afectada),
    INDEX idx_accion (accion),
    INDEX idx_fecha (fecha_accion),
    
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
);

-- Insertar algunos registros de ejemplo
INSERT INTO auditoria (id_usuario, tabla_afectada, accion, valores_nuevos, ip_address, user_agent) VALUES
(1, 'sistema', 'LOGIN', JSON_OBJECT('mensaje', 'Inicio de sesión del administrador'), '127.0.0.1', 'Sistema de Auditoría'),
(NULL, 'sistema', 'INSERT', JSON_OBJECT('mensaje', 'Inicialización del sistema de auditoría'), '127.0.0.1', 'Sistema');
