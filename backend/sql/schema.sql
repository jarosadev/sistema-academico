-- Sistema Académico - Schema de Base de Datos
-- Versión actualizada con migraciones integradas

-- Eliminar tablas si existen (en orden inverso por dependencias)
DROP TABLE IF EXISTS horarios;
DROP TABLE IF EXISTS materias_prerequisitos;
DROP TABLE IF EXISTS auditoria;
DROP TABLE IF EXISTS sesiones;
DROP TABLE IF EXISTS historial_academico;
DROP TABLE IF EXISTS notas;
DROP TABLE IF EXISTS tipos_evaluacion;
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
DROP TRIGGER IF EXISTS tr_cierre_materia_docente;
DROP TRIGGER IF EXISTS auditoria_usuarios_update;

-- Eliminar vistas si existen
DROP VIEW IF EXISTS v_periodos;
DROP VIEW IF EXISTS v_materias_prerequisitos;
DROP VIEW IF EXISTS v_horarios_completos;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
    INDEX idx_mencion (id_mencion),
    INDEX idx_mencion_semestre (id_mencion, semestre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de relación docente-materia con periodo y cierre
CREATE TABLE docente_materias (
    id_docente INT,
    id_materia INT,
    gestion INT NOT NULL,
    periodo INT NOT NULL DEFAULT 1 COMMENT '1: Primero, 2: Segundo, 3: Verano, 4: Invierno',
    paralelo VARCHAR(5) NOT NULL DEFAULT 'A',
    cerrado BOOLEAN DEFAULT FALSE COMMENT 'Indica si la materia ha sido cerrada',
    fecha_cierre TIMESTAMP NULL COMMENT 'Fecha y hora del cierre',
    cerrado_por INT NULL COMMENT 'ID del usuario que cerró la materia',
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_docente, id_materia, gestion, periodo, paralelo),
    FOREIGN KEY (id_docente) REFERENCES docentes(id_docente) ON DELETE CASCADE,
    FOREIGN KEY (id_materia) REFERENCES materias(id_materia) ON DELETE CASCADE,
    FOREIGN KEY (cerrado_por) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    INDEX idx_gestion (gestion),
    INDEX idx_paralelo (paralelo),
    INDEX idx_docente (id_docente),
    INDEX idx_materia (id_materia),
    INDEX idx_cerrado (cerrado),
    INDEX idx_gestion_periodo (gestion, periodo),
    CONSTRAINT chk_periodo_dm CHECK (periodo BETWEEN 1 AND 4)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de inscripciones con periodo
CREATE TABLE inscripciones (
    id_inscripcion INT PRIMARY KEY AUTO_INCREMENT,
    id_estudiante INT NOT NULL,
    id_materia INT NOT NULL,
    gestion VARCHAR(10) NOT NULL,
    periodo INT NOT NULL DEFAULT 1 COMMENT '1: Primero, 2: Segundo, 3: Verano, 4: Invierno',
    paralelo VARCHAR(5) NOT NULL DEFAULT 'A',
    fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('inscrito', 'aprobado', 'reprobado', 'abandonado') DEFAULT 'inscrito',
    nota_final DECIMAL(5,2) NULL COMMENT 'Nota final calculada al cerrar la materia',
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_estudiante) REFERENCES estudiantes(id_estudiante) ON DELETE CASCADE,
    FOREIGN KEY (id_materia) REFERENCES materias(id_materia) ON DELETE CASCADE,
    UNIQUE KEY unique_estudiante_materia_gestion_periodo (id_estudiante, id_materia, gestion, periodo),
    INDEX idx_gestion (gestion),
    INDEX idx_estado (estado),
    INDEX idx_fecha (fecha_inscripcion),
    INDEX idx_estudiante (id_estudiante),
    INDEX idx_materia (id_materia),
    INDEX idx_paralelo (paralelo),
    INDEX idx_gestion_periodo (gestion, periodo),
    INDEX idx_estudiante_estado (id_estudiante, estado),
    CONSTRAINT chk_periodo_ins CHECK (periodo BETWEEN 1 AND 4)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de tipos de evaluación
CREATE TABLE tipos_evaluacion (
    id_tipo_evaluacion INT PRIMARY KEY AUTO_INCREMENT,
    id_materia INT,
    nombre VARCHAR(50),
    porcentaje DECIMAL(5,2),
    orden INT,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_materia) REFERENCES materias(id_materia),
    INDEX idx_tipos_evaluacion_materia (id_materia),
    INDEX idx_tipos_evaluacion_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de notas
CREATE TABLE notas (
    id_nota INT PRIMARY KEY AUTO_INCREMENT,
    id_inscripcion INT NOT NULL,
    calificacion DECIMAL(5,2) NOT NULL,
    id_tipo_evaluacion INT NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_docente INT NOT NULL,
    observaciones TEXT,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_inscripcion) REFERENCES inscripciones(id_inscripcion) ON DELETE CASCADE,
    FOREIGN KEY (id_docente) REFERENCES docentes(id_docente) ON DELETE RESTRICT,
    FOREIGN KEY (id_tipo_evaluacion) REFERENCES tipos_evaluacion(id_tipo_evaluacion) ON DELETE RESTRICT,
    INDEX idx_calificacion (calificacion),
    INDEX idx_tipo_evaluacion (id_tipo_evaluacion),
    INDEX idx_fecha (fecha_registro),
    INDEX idx_inscripcion (id_inscripcion),
    INDEX idx_docente (id_docente),
    CONSTRAINT chk_calificacion CHECK (calificacion >= 0 AND calificacion <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla para prerrequisitos de materias
CREATE TABLE materias_prerequisitos (
    id_materia INT NOT NULL,
    id_materia_prerequisito INT NOT NULL,
    obligatorio BOOLEAN DEFAULT TRUE COMMENT 'Si es obligatorio o alternativo',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_materia, id_materia_prerequisito),
    FOREIGN KEY (id_materia) REFERENCES materias(id_materia) ON DELETE CASCADE,
    FOREIGN KEY (id_materia_prerequisito) REFERENCES materias(id_materia) ON DELETE CASCADE,
    INDEX idx_materia (id_materia),
    INDEX idx_prerequisito (id_materia_prerequisito),
    CONSTRAINT chk_no_self_prerequisite CHECK (id_materia != id_materia_prerequisito)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla para horarios de clases
CREATE TABLE horarios (
    id_horario INT PRIMARY KEY AUTO_INCREMENT,
    id_docente INT NOT NULL,
    id_materia INT NOT NULL,
    gestion INT NOT NULL,
    periodo INT NOT NULL,
    paralelo VARCHAR(5) NOT NULL DEFAULT 'A',
    dia_semana ENUM('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado') NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    aula VARCHAR(50),
    modalidad ENUM('Presencial', 'Virtual', 'Híbrida') DEFAULT 'Presencial',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_docente, id_materia, gestion, periodo, paralelo) 
        REFERENCES docente_materias(id_docente, id_materia, gestion, periodo, paralelo) 
        ON DELETE CASCADE,
    INDEX idx_dia_hora (dia_semana, hora_inicio, hora_fin),
    INDEX idx_aula (aula),
    INDEX idx_docente_materia (id_docente, id_materia),
    INDEX idx_gestion_periodo (gestion, periodo),
    UNIQUE KEY unique_docente_horario (id_docente, gestion, periodo, dia_semana, hora_inicio),
    UNIQUE KEY unique_aula_horario (aula, gestion, periodo, dia_semana, hora_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de historial académico
CREATE TABLE historial_academico (
    id_historial INT PRIMARY KEY AUTO_INCREMENT,
    id_estudiante INT NOT NULL,
    gestion INT NOT NULL,
    promedio DECIMAL(5,2) DEFAULT 0.00,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
    INDEX idx_usuario (id_usuario),
    INDEX idx_tabla (tabla_afectada),
    INDEX idx_accion (accion),
    INDEX idx_fecha (fecha_accion),
    INDEX idx_tabla_accion (tabla_afectada, accion),
    INDEX idx_auditoria_usuario_fecha (id_usuario, fecha_accion),
    INDEX idx_auditoria_tabla_fecha (tabla_afectada, fecha_accion),
    INDEX idx_auditoria_accion_fecha (accion, fecha_accion),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Vista para periodos
CREATE VIEW v_periodos AS
SELECT 1 as id, 'Primero' as nombre
UNION SELECT 2, 'Segundo'
UNION SELECT 3, 'Verano'
UNION SELECT 4, 'Invierno';

-- Vista para consultar prerrequisitos con información completa
CREATE VIEW v_materias_prerequisitos AS
SELECT 
    m.id_materia,
    m.nombre as materia_nombre,
    m.sigla as materia_sigla,
    m.semestre as materia_semestre,
    mp.id_materia_prerequisito,
    mp2.nombre as prerequisito_nombre,
    mp2.sigla as prerequisito_sigla,
    mp2.semestre as prerequisito_semestre,
    mp.obligatorio,
    mp.fecha_creacion
FROM materias m
INNER JOIN materias_prerequisitos mp ON m.id_materia = mp.id_materia
INNER JOIN materias mp2 ON mp.id_materia_prerequisito = mp2.id_materia
ORDER BY m.semestre, m.nombre, mp2.semestre, mp2.nombre;

-- Vista para consultar horarios con información completa
CREATE VIEW v_horarios_completos AS
SELECT 
    h.*,
    m.nombre as materia_nombre,
    m.sigla as materia_sigla,
    m.semestre,
    CONCAT(d.nombre, ' ', d.apellido) as docente_nombre,
    men.nombre as mencion_nombre,
    CASE 
        WHEN h.periodo = 1 THEN 'Primero'
        WHEN h.periodo = 2 THEN 'Segundo'
        WHEN h.periodo = 3 THEN 'Verano'
        WHEN h.periodo = 4 THEN 'Invierno'
    END as periodo_nombre
FROM horarios h
INNER JOIN materias m ON h.id_materia = m.id_materia
INNER JOIN docentes d ON h.id_docente = d.id_docente
INNER JOIN menciones men ON m.id_mencion = men.id_mencion
WHERE h.activo = TRUE
ORDER BY h.gestion DESC, h.periodo, h.dia_semana, h.hora_inicio;

-- Vista para auditoría detallada
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


-- Stored Procedure to update academic history summary for a student and gestion
DELIMITER //
CREATE PROCEDURE sp_actualizar_historial_academico(
    IN p_id_estudiante INT,
    IN p_gestion INT
)
BEGIN
    DECLARE v_promedio DECIMAL(5,2);
    DECLARE v_aprobadas INT;
    DECLARE v_reprobadas INT;
    DECLARE v_abandonadas INT;
    DECLARE v_total INT;
    DECLARE v_porcentaje_avance DECIMAL(5,2);
    DECLARE v_materias_requeridas INT;

    -- Calculate counts and average
    SELECT 
        COALESCE(AVG(CASE WHEN i.estado = 'aprobado' THEN n.calificacion ELSE NULL END), 0),
        SUM(CASE WHEN i.estado = 'aprobado' THEN 1 ELSE 0 END),
        SUM(CASE WHEN i.estado = 'reprobado' THEN 1 ELSE 0 END),
        SUM(CASE WHEN i.estado = 'abandonado' THEN 1 ELSE 0 END),
        COUNT(*)
    INTO v_promedio, v_aprobadas, v_reprobadas, v_abandonadas, v_total
    FROM inscripciones i
    LEFT JOIN notas n ON i.id_inscripcion = n.id_inscripcion
    WHERE i.id_estudiante = p_id_estudiante AND i.gestion = p_gestion;

    -- Get total materias required for the student's mention
    SELECT materias_requeridas INTO v_materias_requeridas
    FROM estudiantes e
    INNER JOIN menciones m ON e.id_mencion = m.id_mencion
    WHERE e.id_estudiante = p_id_estudiante;

    IF v_materias_requeridas IS NULL THEN
        SET v_materias_requeridas = 0;
    END IF;

    -- Calculate percentage progress
    IF v_materias_requeridas > 0 THEN
        SET v_porcentaje_avance = (v_aprobadas / v_materias_requeridas) * 100;
    ELSE
        SET v_porcentaje_avance = 0;
    END IF;

    -- Insert or update historial_academico
    INSERT INTO historial_academico (
        id_estudiante, gestion, promedio, materias_aprobadas, materias_reprobadas, materias_abandonadas, total_materias, porcentaje_avance, fecha_calculo
    ) VALUES (
        p_id_estudiante, p_gestion, v_promedio, v_aprobadas, v_reprobadas, v_abandonadas, v_total, v_porcentaje_avance, NOW()
    )
    ON DUPLICATE KEY UPDATE
        promedio = v_promedio,
        materias_aprobadas = v_aprobadas,
        materias_reprobadas = v_reprobadas,
        materias_abandonadas = v_abandonadas,
        total_materias = v_total,
        porcentaje_avance = v_porcentaje_avance,
        fecha_calculo = NOW();
END //
DELIMITER ;

-- Trigger to validate maximum number of materias per student on insert into inscripciones
DELIMITER //
CREATE TRIGGER tr_validar_max_materias_inscripcion
BEFORE INSERT ON inscripciones
FOR EACH ROW
BEGIN
    DECLARE v_max_materias INT DEFAULT 7; -- Set maximum allowed materias per gestion
    DECLARE v_count INT;

    SELECT COUNT(*) INTO v_count
    FROM inscripciones
    WHERE id_estudiante = NEW.id_estudiante
      AND gestion = NEW.gestion;

    IF v_count >= v_max_materias THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El estudiante ha alcanzado el máximo número de materias permitidas para esta gestión.';
    END IF;
END //
DELIMITER ;
