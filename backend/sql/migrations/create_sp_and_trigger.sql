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
