-- Sistema Académico - Schema de Base de Datos Corregido
-- Creación de tablas con estructura mejorada para MySQL

-- Eliminar tablas si existen (en orden inverso por dependencias)
DROP TABLE IF EXISTS auditoria;
DROP TABLE IF EXISTS sesiones;
DROP TABLE IF EXISTS historial_academico;
DROP TABLE IF EXISTS notas;
DROP TABLE IF EXISTS inscripciones;
DROP TABLE IF EXISTS docente_materias;
DROP TABLE IF EXISTS materias;
DROP TABLE IF EXISTS estudiantes;
DROP TABLE IF EXISTS docentes;
DROP TABLE IF EXISTS menciones;
DROP TABLE IF EXISTS usuario_roles;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS roles;

-- Eliminar procedimientos y funciones si existen
DROP PROCEDURE IF EXISTS sp_actualizar_historial_academico;
DROP PROCEDURE IF EXISTS LimpiarAuditoriaAntigua;
DROP FUNCTION IF EXISTS ObtenerEstadisticasAuditoria;

-- Eliminar triggers si existen
DROP TRIGGER IF EXISTS tr_actualizar_historial_inscripcion;
DROP TRIGGER IF EXISTS tr_actualizar_historial_nota;
DROP TRIGGER IF EXISTS auditoria_usuarios_update;

-- Eliminar vistas si existen
DROP VIEW IF EXISTS vista_auditoria_detallada;

-- Tabla de roles del sistema
CREATE TABLE roles (
    id_rol INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    permisos JSON,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nombre (nombre),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de usuarios del sistema
CREATE TABLE usuarios (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    correo VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    ultimo_acceso TIMESTAMP NULL,
    intentos_fallidos INT DEFAULT 0,
    bloqueado_hasta TIMESTAMP NULL,
    token_recuperacion VARCHAR(255) NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_correo (correo),
    INDEX idx_activo (activo),
    INDEX idx_token_recuperacion (token_recuperacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de relación usuario-rol (muchos a muchos)
CREATE TABLE usuario_roles (
    id_usuario INT,
    id_rol INT,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_usuario, id_rol),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_rol) REFERENCES roles(id_rol) ON DELETE CASCADE,
    INDEX idx_usuario (id_usuario),
    INDEX idx_rol (id_rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de menciones académicas
CREATE TABLE menciones (
    id_mencion INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    materias_requeridas INT NOT NULL DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nombre (nombre),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de estudiantes
CREATE TABLE estudiantes (
    id_estudiante INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    ci VARCHAR(20) NOT NULL UNIQUE,
    fecha_nacimiento DATE NOT NULL,
    direccion TEXT,
    telefono VARCHAR(20),
    id_usuario INT NOT NULL,
    id_mencion INT,
    estado_academico ENUM('activo', 'inactivo', 'graduado', 'suspendido') DEFAULT 'activo',
    fecha_ingreso DATE NOT NULL DEFAULT (CURDATE()),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_mencion) REFERENCES menciones(id_mencion) ON DELETE SET NULL,
    INDEX idx_ci (ci),
    INDEX idx_nombre_apellido (nombre, apellido),
    INDEX idx_estado (estado_academico),
    INDEX idx_usuario (id_usuario),
    INDEX idx_mencion (id_mencion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de docentes
CREATE TABLE docentes (
    id_docente INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    ci VARCHAR(20) NOT NULL UNIQUE,
    especialidad VARCHAR(200),
    telefono VARCHAR(20),
    id_usuario INT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_contratacion DATE NOT NULL DEFAULT (CURDATE()),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    INDEX idx_ci (ci),
    INDEX idx_nombre_apellido (nombre, apellido),
    INDEX idx_activo (activo),
    INDEX idx_usuario (id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de materias
CREATE TABLE materias (
    id_materia INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(150) NOT NULL,
    sigla VARCHAR(10) NOT NULL,
    semestre INT NOT NULL,
    id_mencion INT NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_mencion) REFERENCES menciones(id_mencion) ON DELETE CASCADE,
    UNIQUE KEY unique_sigla_mencion (sigla, id_mencion),
    INDEX idx_semestre (semestre),
    INDEX idx_nombre (nombre),
    INDEX idx_activo (activo),
    INDEX idx_mencion (id_mencion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de relación docente-materia (muchos a muchos)
CREATE TABLE docente_materias (
    id_docente INT,
    id_materia INT,
    gestion INT NOT NULL,
    paralelo VARCHAR(5) NOT NULL DEFAULT 'A',
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_docente, id_materia, gestion, paralelo),
    FOREIGN KEY (id_docente) REFERENCES docentes(id_docente) ON DELETE CASCADE,
    FOREIGN KEY (id_materia) REFERENCES materias(id_materia) ON DELETE CASCADE,
    INDEX idx_gestion (gestion),
    INDEX idx_paralelo (paralelo),
    INDEX idx_docente (id_docente),
    INDEX idx_materia (id_materia)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de inscripciones
CREATE TABLE inscripciones (
    id_inscripcion INT PRIMARY KEY AUTO_INCREMENT,
    id_estudiante INT NOT NULL,
    id_materia INT NOT NULL,
    gestion VARCHAR(10) NOT NULL,
    paralelo VARCHAR(5) NOT NULL DEFAULT 'A',
    fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('inscrito', 'aprobado', 'reprobado', 'abandonado') DEFAULT 'inscrito',
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_estudiante) REFERENCES estudiantes(id_estudiante) ON DELETE CASCADE,
    FOREIGN KEY (id_materia) REFERENCES materias(id_materia) ON DELETE CASCADE,
    UNIQUE KEY unique_estudiante_materia_gestion (id_estudiante, id_materia, gestion),
    INDEX idx_gestion (gestion),
    INDEX idx_estado (estado),
    INDEX idx_fecha (fecha_inscripcion),
    INDEX idx_estudiante (id_estudiante),
    INDEX idx_materia (id_materia),
    INDEX idx_paralelo (paralelo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de notas
CREATE TABLE notas (
    id_nota INT PRIMARY KEY AUTO_INCREMENT,
    id_inscripcion INT NOT NULL,
    calificacion DECIMAL(4,2) NOT NULL,
    tipo_evaluacion ENUM('parcial1', 'parcial2', 'final', 'segunda_instancia') NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_docente INT NOT NULL,
    observaciones TEXT,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_inscripcion) REFERENCES inscripciones(id_inscripcion) ON DELETE CASCADE,
    FOREIGN KEY (id_docente) REFERENCES docentes(id_docente) ON DELETE RESTRICT,
    INDEX idx_calificacion (calificacion),
    INDEX idx_tipo (tipo_evaluacion),
    INDEX idx_fecha (fecha_registro),
    INDEX idx_inscripcion (id_inscripcion),
    INDEX idx_docente (id_docente),
    CONSTRAINT chk_calificacion CHECK (calificacion >= 0 AND calificacion <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de historial académico
CREATE TABLE historial_academico (
    id_historial INT PRIMARY KEY AUTO_INCREMENT,
    id_estudiante INT NOT NULL,
    gestion INT NOT NULL,
    promedio DECIMAL(4,2) DEFAULT 0.00,
    materias_aprobadas INT DEFAULT 0,
    materias_reprobadas INT DEFAULT 0,
    materias_abandonadas INT DEFAULT 0,
    total_materias INT DEFAULT 0,
    porcentaje_avance DECIMAL(5,2) DEFAULT 0.00,
    fecha_calculo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_estudiante) REFERENCES estudiantes(id_estudiante) ON DELETE CASCADE,
    UNIQUE KEY unique_estudiante_gestion (id_estudiante, gestion),
    INDEX idx_gestion (gestion),
    INDEX idx_promedio (promedio),
    INDEX idx_estudiante (id_estudiante),
    CONSTRAINT chk_promedio CHECK (promedio >= 0 AND promedio <= 100),
    CONSTRAINT chk_porcentaje CHECK (porcentaje_avance >= 0 AND porcentaje_avance <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de auditoría
CREATE TABLE auditoria (
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
    INDEX idx_auditoria_usuario_fecha (id_usuario, fecha_accion),
    INDEX idx_auditoria_tabla_fecha (tabla_afectada, fecha_accion),
    INDEX idx_auditoria_accion_fecha (accion, fecha_accion),
    
    -- Clave foránea opcional
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de sesiones (para manejo de JWT)
CREATE TABLE sesiones (
    id_sesion INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    INDEX idx_token (token_hash),
    INDEX idx_usuario (id_usuario),
    INDEX idx_expiracion (fecha_expiracion),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Procedimiento almacenado para actualizar historial académico
DELIMITER //

CREATE PROCEDURE sp_actualizar_historial_academico(
    IN p_id_estudiante INT,
    IN p_gestion INT
)
BEGIN
    DECLARE v_promedio DECIMAL(4,2) DEFAULT 0.00;
    DECLARE v_aprobadas INT DEFAULT 0;
    DECLARE v_reprobadas INT DEFAULT 0;
    DECLARE v_abandonadas INT DEFAULT 0;
    DECLARE v_total INT DEFAULT 0;
    DECLARE v_porcentaje DECIMAL(5,2) DEFAULT 0.00;
    DECLARE v_materias_requeridas INT DEFAULT 0;
    
    -- Calcular estadísticas
    SELECT 
        COUNT(CASE WHEN i.estado = 'aprobado' THEN 1 END),
        COUNT(CASE WHEN i.estado = 'reprobado' THEN 1 END),
        COUNT(CASE WHEN i.estado = 'abandonado' THEN 1 END),
        COUNT(*)
    INTO v_aprobadas, v_reprobadas, v_abandonadas, v_total
    FROM inscripciones i
    WHERE i.id_estudiante = p_id_estudiante AND i.gestion = p_gestion;
    
    -- Calcular promedio de notas finales
    SELECT COALESCE(AVG(n.calificacion), 0)
    INTO v_promedio
    FROM notas n
    INNER JOIN inscripciones i ON n.id_inscripcion = i.id_inscripcion
    WHERE i.id_estudiante = p_id_estudiante 
    AND i.gestion = p_gestion 
    AND n.tipo_evaluacion = 'final'
    AND i.estado = 'aprobado';
    
    -- Obtener materias requeridas para la mención
    SELECT COALESCE(m.materias_requeridas, 0)
    INTO v_materias_requeridas
    FROM estudiantes e
    LEFT JOIN menciones m ON e.id_mencion = m.id_mencion
    WHERE e.id_estudiante = p_id_estudiante;
    
    -- Calcular porcentaje de avance
    IF v_materias_requeridas > 0 THEN
        SET v_porcentaje = (v_aprobadas * 100.0) / v_materias_requeridas;
    END IF;
    
    -- Insertar o actualizar historial
    INSERT INTO historial_academico (
        id_estudiante, gestion, promedio, materias_aprobadas,
        materias_reprobadas, materias_abandonadas, total_materias,
        porcentaje_avance
    ) VALUES (
        p_id_estudiante, p_gestion, v_promedio, v_aprobadas,
        v_reprobadas, v_abandonadas, v_total, v_porcentaje
    )
    ON DUPLICATE KEY UPDATE
        promedio = v_promedio,
        materias_aprobadas = v_aprobadas,
        materias_reprobadas = v_reprobadas,
        materias_abandonadas = v_abandonadas,
        total_materias = v_total,
        porcentaje_avance = v_porcentaje,
        fecha_actualizacion = CURRENT_TIMESTAMP;
        
END//

DELIMITER ;

-- Triggers para actualizar historial académico automáticamente
DELIMITER //

-- Trigger para actualizar historial cuando se actualiza una inscripción
CREATE TRIGGER tr_actualizar_historial_inscripcion
AFTER UPDATE ON inscripciones
FOR EACH ROW
BEGIN
    IF OLD.estado != NEW.estado THEN
        CALL sp_actualizar_historial_academico(NEW.id_estudiante, NEW.gestion);
    END IF;
END//

-- Trigger para actualizar historial cuando se registra/actualiza una nota
CREATE TRIGGER tr_actualizar_historial_nota
AFTER INSERT ON notas
FOR EACH ROW
BEGIN
    DECLARE v_gestion INT;
    DECLARE v_estudiante INT;
    
    SELECT i.gestion, i.id_estudiante 
    INTO v_gestion, v_estudiante
    FROM inscripciones i 
    WHERE i.id_inscripcion = NEW.id_inscripcion;
    
    CALL sp_actualizar_historial_academico(v_estudiante, v_gestion);
END//

DELIMITER ;

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
    DECLARE resultado JSON DEFAULT '{}';
    DECLARE total_acciones INT DEFAULT 0;
    
    -- Obtener total de acciones
    SELECT COUNT(*) INTO total_acciones
    FROM auditoria 
    WHERE fecha_accion BETWEEN fecha_inicio AND fecha_fin;
    
    -- Construir JSON con estadísticas básicas
    SET resultado = JSON_OBJECT(
        'total_acciones', total_acciones,
        'periodo', JSON_OBJECT(
            'inicio', fecha_inicio,
            'fin', fecha_fin
        )
    );
    
    RETURN resultado;
END //
DELIMITER ;

-- Trigger para auditar cambios en la tabla usuarios
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

-- Crear vista para consultas frecuentes de auditoría
CREATE VIEW vista_auditoria_detallada AS
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

-- Insertar algunos registros de ejemplo para pruebas
INSERT INTO auditoria (id_usuario, tabla_afectada, accion, valores_nuevos, ip_address, user_agent) VALUES
(NULL, 'sistema', 'INSERT', JSON_OBJECT('mensaje', 'Inicialización del sistema de auditoría'), '127.0.0.1', 'Sistema');

-- Comentarios adicionales sobre el schema
-- Correcciones aplicadas:
-- 1. Eliminado "USE sew;" - se debe especificar la base de datos al conectar
-- 2. Removido CREATE OR REPLACE VIEW (no soportado en MySQL, usar CREATE VIEW)
-- 3. Simplificada la función ObtenerEstadisticasAuditoria para evitar subconsultas complejas
-- 4. Añadido NOT NULL a campos de fecha que lo requerían
-- 5. Movidos todos los índices adicionales a la definición de la tabla auditoria
-- 6. Corregido el trigger para obtener correctamente id_estudiante y gestion
-- 7. Removidos comentarios ALTER TABLE para modificar comentarios (opcionales en MySQL)

SELECT 'Schema corregido e instalado correctamente' as mensaje;