-- Migration: Add semester closure functionality
-- Date: 2024
-- Description: Adds periodo (semester/period) and closure tracking to docente_materias and inscripciones

-- Add periodo to docente_materias
ALTER TABLE docente_materias 
ADD COLUMN periodo INT NOT NULL DEFAULT 1 COMMENT '1: Primero, 2: Segundo, 3: Verano, 4: Invierno' AFTER gestion,
ADD COLUMN cerrado BOOLEAN DEFAULT FALSE COMMENT 'Indica si la materia ha sido cerrada',
ADD COLUMN fecha_cierre TIMESTAMP NULL COMMENT 'Fecha y hora del cierre',
ADD COLUMN cerrado_por INT NULL COMMENT 'ID del usuario que cerró la materia',
DROP PRIMARY KEY,
ADD PRIMARY KEY (id_docente, id_materia, gestion, periodo, paralelo),
ADD INDEX idx_cerrado (cerrado),
ADD INDEX idx_gestion_periodo (gestion, periodo),
ADD FOREIGN KEY (cerrado_por) REFERENCES usuarios(id_usuario) ON DELETE SET NULL;

-- Add periodo to inscripciones
ALTER TABLE inscripciones 
ADD COLUMN periodo INT NOT NULL DEFAULT 1 COMMENT '1: Primero, 2: Segundo, 3: Verano, 4: Invierno' AFTER gestion,
DROP INDEX unique_estudiante_materia_gestion,
ADD UNIQUE KEY unique_estudiante_materia_gestion_periodo (id_estudiante, id_materia, gestion, periodo),
ADD INDEX idx_gestion_periodo (gestion, periodo);

-- Update existing records to have periodo = 1 (assuming they are all first semester)
UPDATE docente_materias SET periodo = 1 WHERE periodo = 0;
UPDATE inscripciones SET periodo = 1 WHERE periodo = 0;

-- Add check constraint to ensure periodo is valid (1-4)
ALTER TABLE docente_materias ADD CONSTRAINT chk_periodo_dm CHECK (periodo BETWEEN 1 AND 4);
ALTER TABLE inscripciones ADD CONSTRAINT chk_periodo_ins CHECK (periodo BETWEEN 1 AND 4);

-- Create view for period names
CREATE VIEW v_periodos AS
SELECT 1 as id, 'Primero' as nombre
UNION SELECT 2, 'Segundo'
UNION SELECT 3, 'Verano'
UNION SELECT 4, 'Invierno';
