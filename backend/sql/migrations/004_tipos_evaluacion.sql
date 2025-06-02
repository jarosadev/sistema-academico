-- Crear nueva tabla para tipos de evaluación
CREATE TABLE tipos_evaluacion (
    id_tipo_evaluacion INT PRIMARY KEY AUTO_INCREMENT,
    id_materia INT,
    nombre VARCHAR(50),
    porcentaje DECIMAL(5,2),
    orden INT,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_materia) REFERENCES materias(id_materia)
);

-- Insertar tipos de evaluación por defecto para todas las materias existentes
INSERT INTO tipos_evaluacion (id_materia, nombre, porcentaje, orden)
SELECT 
    id_materia,
    'Primer Parcial',
    30,
    1
FROM materias WHERE activo = true;

INSERT INTO tipos_evaluacion (id_materia, nombre, porcentaje, orden)
SELECT 
    id_materia,
    'Segundo Parcial',
    30,
    2
FROM materias WHERE activo = true;

INSERT INTO tipos_evaluacion (id_materia, nombre, porcentaje, orden)
SELECT 
    id_materia,
    'Examen Final',
    40,
    3
FROM materias WHERE activo = true;

-- Crear tabla temporal para migrar datos existentes
CREATE TEMPORARY TABLE temp_notas AS 
SELECT 
    id_nota,
    id_inscripcion,
    calificacion,
    tipo_evaluacion,
    id_docente,
    observaciones,
    fecha_registro,
    fecha_actualizacion
FROM notas;

-- Modificar tabla notas
ALTER TABLE notas 
    DROP COLUMN tipo_evaluacion,
    ADD COLUMN id_tipo_evaluacion INT,
    ADD FOREIGN KEY (id_tipo_evaluacion) REFERENCES tipos_evaluacion(id_tipo_evaluacion);

-- Migrar datos existentes
UPDATE notas n
INNER JOIN temp_notas tn ON n.id_nota = tn.id_nota
INNER JOIN inscripciones i ON n.id_inscripcion = i.id_inscripcion
INNER JOIN tipos_evaluacion te ON i.id_materia = te.id_materia
SET n.id_tipo_evaluacion = te.id_tipo_evaluacion
WHERE 
    CASE tn.tipo_evaluacion
        WHEN 'parcial1' THEN te.orden = 1
        WHEN 'parcial2' THEN te.orden = 2
        WHEN 'final' THEN te.orden = 3
        ELSE FALSE
    END;

-- Limpiar
DROP TEMPORARY TABLE temp_notas;

-- Crear índices
CREATE INDEX idx_tipos_evaluacion_materia ON tipos_evaluacion(id_materia);
CREATE INDEX idx_tipos_evaluacion_activo ON tipos_evaluacion(activo);
CREATE INDEX idx_notas_tipo_evaluacion ON notas(id_tipo_evaluacion);
