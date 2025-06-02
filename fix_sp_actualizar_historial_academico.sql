DELIMITER //

DROP PROCEDURE IF EXISTS sp_actualizar_historial_academico //

CREATE PROCEDURE sp_actualizar_historial_academico(
    IN p_id_estudiante INT,
    IN p_gestion VARCHAR(10)
)
BEGIN
    DECLARE v_promedio DECIMAL(4,2) DEFAULT 0.00;
    DECLARE v_aprobadas INT DEFAULT 0;
    DECLARE v_reprobadas INT DEFAULT 0;
    DECLARE v_abandonadas INT DEFAULT 0;
    DECLARE v_total INT DEFAULT 0;
    DECLARE v_porcentaje DECIMAL(5,2) DEFAULT 0.00;
    DECLARE v_gestion_int INT;
    
    -- Convertir gestion string a int (ejemplo: '2024-1' -> 2024)
    SET v_gestion_int = CAST(SUBSTRING_INDEX(p_gestion, '-', 1) AS SIGNED);

    -- Calcular estadísticas
    SELECT
        COUNT(CASE WHEN i.estado = 'aprobado' THEN 1 END),
        COUNT(CASE WHEN i.estado = 'reprobado' THEN 1 END),
        COUNT(CASE WHEN i.estado = 'abandonado' THEN 1 END),
        COUNT(*)
    INTO 
        v_aprobadas, v_reprobadas, v_abandonadas, v_total
    FROM inscripciones i
    WHERE i.id_estudiante = p_id_estudiante 
    AND i.gestion = p_gestion;

    -- Calcular promedio de notas finales
    SELECT COALESCE(AVG(n.calificacion), 0)
    INTO v_promedio
    FROM notas n
    INNER JOIN inscripciones i ON n.id_inscripcion = i.id_inscripcion
    INNER JOIN tipos_evaluacion te ON n.id_tipo_evaluacion = te.id_tipo_evaluacion
    WHERE i.id_estudiante = p_id_estudiante
    AND i.gestion = p_gestion
    AND te.nombre = 'final'
    AND i.estado = 'aprobado';

    -- Calcular porcentaje de avance (sobre el total de materias inscritas)
    IF v_total > 0 THEN
        SET v_porcentaje = (v_aprobadas * 100.0) / v_total;
    END IF;

    -- Insertar o actualizar historial
    INSERT INTO historial_academico (
        id_estudiante,
        gestion,
        promedio,
        materias_aprobadas,
        materias_reprobadas,
        materias_abandonadas,
        total_materias,
        porcentaje_avance
    ) VALUES (
        p_id_estudiante,
        v_gestion_int,
        v_promedio,
        v_aprobadas,
        v_reprobadas,
        v_abandonadas,
        v_total,
        v_porcentaje
    )
    ON DUPLICATE KEY UPDATE
        promedio = v_promedio,
        materias_aprobadas = v_aprobadas,
        materias_reprobadas = v_reprobadas,
        materias_abandonadas = v_abandonadas,
        total_materias = v_total,
        porcentaje_avance = v_porcentaje,
        fecha_actualizacion = CURRENT_TIMESTAMP;

END //

DELIMITER ;
