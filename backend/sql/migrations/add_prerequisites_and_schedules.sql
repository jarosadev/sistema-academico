-- Migration: Add prerequisites and schedules system
-- Date: 2024
-- Description: Adds prerequisites for subjects and class schedules

-- 1. Tabla para prerrequisitos de materias (relación muchos a muchos)
CREATE TABLE IF NOT EXISTS materias_prerequisitos (
    id_materia INT NOT NULL,
    id_materia_prerequisito INT NOT NULL,
    obligatorio BOOLEAN DEFAULT TRUE COMMENT 'Si es obligatorio o alternativo',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_materia, id_materia_prerequisito),
    FOREIGN KEY (id_materia) REFERENCES materias(id_materia) ON DELETE CASCADE,
    FOREIGN KEY (id_materia_prerequisito) REFERENCES materias(id_materia) ON DELETE CASCADE,
    INDEX idx_materia (id_materia),
    INDEX idx_prerequisito (id_materia_prerequisito),
    -- Evitar que una materia sea su propio prerrequisito
    CONSTRAINT chk_no_self_prerequisite CHECK (id_materia != id_materia_prerequisito)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabla para horarios de clases
CREATE TABLE IF NOT EXISTS horarios (
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
    -- Evitar solapamiento de horarios para el mismo docente
    UNIQUE KEY unique_docente_horario (id_docente, gestion, periodo, dia_semana, hora_inicio),
    -- Evitar solapamiento de aulas (solo si el aula no es NULL)
    UNIQUE KEY unique_aula_horario (aula, gestion, periodo, dia_semana, hora_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Vista para consultar prerrequisitos de una materia con información completa
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

-- 4. Vista para consultar horarios con información completa
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

-- 5. Índices adicionales para mejorar rendimiento
ALTER TABLE inscripciones ADD INDEX idx_estudiante_estado (id_estudiante, estado);
ALTER TABLE materias ADD INDEX idx_mencion_semestre (id_mencion, semestre);

-- Mensaje de confirmación
SELECT 'Migración de prerrequisitos y horarios completada exitosamente' as mensaje;
