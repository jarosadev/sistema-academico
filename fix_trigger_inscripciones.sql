DELIMITER //

DROP TRIGGER IF EXISTS tr_actualizar_historial_inscripcion //

CREATE TRIGGER tr_actualizar_historial_inscripcion
AFTER UPDATE ON inscripciones
FOR EACH ROW
BEGIN
    IF OLD.estado != NEW.estado THEN
        CALL sp_actualizar_historial_academico(NEW.id_estudiante, NEW.gestion);
    END IF;
END //

DROP TRIGGER IF EXISTS tr_actualizar_historial_nota //

CREATE TRIGGER tr_actualizar_historial_nota
AFTER INSERT ON notas
FOR EACH ROW
BEGIN
    DECLARE v_gestion VARCHAR(10);
    DECLARE v_estudiante INT;

    SELECT i.gestion, i.id_estudiante
    INTO v_gestion, v_estudiante
    FROM inscripciones i
    WHERE i.id_inscripcion = NEW.id_inscripcion;

    CALL sp_actualizar_historial_academico(v_estudiante, v_gestion);
END //

DELIMITER ;
