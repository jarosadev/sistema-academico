const { executeQuery } = require('../config/database');
const { createError } = require('../middleware/errorHandler');
const { auditAction } = require('../middleware/audit-complete');

/**
 * Controlador para gestión de horarios
 */
class HorarioController {
    /**
     * Listar horarios con filtros
     */
    async listarHorarios(req, res, next) {
        try {
            const {
                gestion,
                periodo,
                id_docente,
                id_materia,
                dia_semana,
                aula
            } = req.query;

            let whereConditions = ['h.activo = TRUE'];
            let queryParams = [];

            if (gestion) {
                whereConditions.push('h.gestion = ?');
                queryParams.push(gestion);
            }

            if (periodo) {
                whereConditions.push('h.periodo = ?');
                queryParams.push(periodo);
            }

            if (id_docente) {
                whereConditions.push('h.id_docente = ?');
                queryParams.push(id_docente);
            }

            if (id_materia) {
                whereConditions.push('h.id_materia = ?');
                queryParams.push(id_materia);
            }

            if (dia_semana) {
                whereConditions.push('h.dia_semana = ?');
                queryParams.push(dia_semana);
            }

            if (aula) {
                whereConditions.push('h.aula = ?');
                queryParams.push(aula);
            }

            const whereClause = whereConditions.join(' AND ');

            const query = `
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
                WHERE ${whereClause}
                ORDER BY h.gestion DESC, h.periodo, 
                    FIELD(h.dia_semana, 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'),
                    h.hora_inicio
            `;

            const horarios = await executeQuery(query, queryParams);

            res.json({
                success: true,
                data: horarios
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtener horario por ID
     */
    async obtenerHorario(req, res, next) {
        try {
            const { id } = req.params;

            const query = `
                SELECT 
                    h.*,
                    m.nombre as materia_nombre,
                    m.sigla as materia_sigla,
                    CONCAT(d.nombre, ' ', d.apellido) as docente_nombre
                FROM horarios h
                INNER JOIN materias m ON h.id_materia = m.id_materia
                INNER JOIN docentes d ON h.id_docente = d.id_docente
                WHERE h.id_horario = ?
            `;

            const horarios = await executeQuery(query, [id]);

            if (horarios.length === 0) {
                throw createError('Horario no encontrado', 404);
            }

            res.json({
                success: true,
                data: horarios[0]
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Crear nuevo horario
     */
    async crearHorario(req, res, next) {
        try {
            const {
                id_docente,
                id_materia,
                gestion,
                periodo,
                paralelo = 'A',
                dia_semana,
                hora_inicio,
                hora_fin,
                aula,
                modalidad = 'Presencial'
            } = req.body;

            // Validar que la asignación docente-materia existe
            const asignacionExiste = await executeQuery(
                `SELECT * FROM docente_materias 
                 WHERE id_docente = ? AND id_materia = ? 
                 AND gestion = ? AND periodo = ? AND paralelo = ?`,
                [id_docente, id_materia, gestion, periodo, paralelo]
            );

            if (asignacionExiste.length === 0) {
                throw createError('El docente no tiene asignada esta materia en este periodo', 404);
            }

            // Validar horario del docente (no solapamiento)
            const conflictoDocente = await this.verificarConflictoHorarioDocente(
                id_docente, gestion, periodo, dia_semana, hora_inicio, hora_fin
            );

            if (conflictoDocente) {
                throw createError(
                    `El docente ya tiene clase de ${conflictoDocente.materia_nombre} en este horario`,
                    409
                );
            }

            // Validar disponibilidad del aula
            if (aula) {
                const conflictoAula = await this.verificarConflictoAula(
                    aula, gestion, periodo, dia_semana, hora_inicio, hora_fin
                );

                if (conflictoAula) {
                    throw createError(
                        `El aula ${aula} está ocupada por ${conflictoAula.materia_nombre} con ${conflictoAula.docente_nombre}`,
                        409
                    );
                }
            }

            // Insertar horario
            const query = `
                INSERT INTO horarios (
                    id_docente, id_materia, gestion, periodo, paralelo,
                    dia_semana, hora_inicio, hora_fin, aula, modalidad
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const result = await executeQuery(query, [
                id_docente, id_materia, gestion, periodo, paralelo,
                dia_semana, hora_inicio, hora_fin, aula, modalidad
            ]);

            // Auditar acción
            await auditAction(req, 'horarios', 'INSERT', null, null, {
                id_horario: result.insertId,
                id_docente,
                id_materia,
                gestion,
                periodo,
                paralelo,
                dia_semana,
                hora_inicio,
                hora_fin,
                aula,
                modalidad
            });

            res.status(201).json({
                success: true,
                message: 'Horario creado exitosamente',
                data: {
                    id_horario: result.insertId
                }
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Actualizar horario
     */
    async actualizarHorario(req, res, next) {
        try {
            const { id } = req.params;
            const {
                dia_semana,
                hora_inicio,
                hora_fin,
                aula,
                modalidad,
                activo
            } = req.body;

            // Verificar que el horario existe
            const horarioExistente = await executeQuery(
                'SELECT * FROM horarios WHERE id_horario = ?',
                [id]
            );

            if (horarioExistente.length === 0) {
                throw createError('Horario no encontrado', 404);
            }

            const horario = horarioExistente[0];

            // Si se cambia el horario, verificar conflictos
            if (dia_semana || hora_inicio || hora_fin) {
                const nuevoHorario = {
                    dia_semana: dia_semana || horario.dia_semana,
                    hora_inicio: hora_inicio || horario.hora_inicio,
                    hora_fin: hora_fin || horario.hora_fin
                };

                // Verificar conflicto docente
                const conflictoDocente = await this.verificarConflictoHorarioDocente(
                    horario.id_docente,
                    horario.gestion,
                    horario.periodo,
                    nuevoHorario.dia_semana,
                    nuevoHorario.hora_inicio,
                    nuevoHorario.hora_fin,
                    id
                );

                if (conflictoDocente) {
                    throw createError(
                        `El docente ya tiene clase de ${conflictoDocente.materia_nombre} en este horario`,
                        409
                    );
                }

                // Verificar conflicto aula
                const aulaVerificar = aula || horario.aula;
                if (aulaVerificar) {
                    const conflictoAula = await this.verificarConflictoAula(
                        aulaVerificar,
                        horario.gestion,
                        horario.periodo,
                        nuevoHorario.dia_semana,
                        nuevoHorario.hora_inicio,
                        nuevoHorario.hora_fin,
                        id
                    );

                    if (conflictoAula) {
                        throw createError(
                            `El aula ${aulaVerificar} está ocupada por ${conflictoAula.materia_nombre}`,
                            409
                        );
                    }
                }
            }

            // Actualizar horario
            const updateFields = [];
            const updateValues = [];

            if (dia_semana !== undefined) {
                updateFields.push('dia_semana = ?');
                updateValues.push(dia_semana);
            }
            if (hora_inicio !== undefined) {
                updateFields.push('hora_inicio = ?');
                updateValues.push(hora_inicio);
            }
            if (hora_fin !== undefined) {
                updateFields.push('hora_fin = ?');
                updateValues.push(hora_fin);
            }
            if (aula !== undefined) {
                updateFields.push('aula = ?');
                updateValues.push(aula);
            }
            if (modalidad !== undefined) {
                updateFields.push('modalidad = ?');
                updateValues.push(modalidad);
            }
            if (activo !== undefined) {
                updateFields.push('activo = ?');
                updateValues.push(activo);
            }

            updateValues.push(id);

            const query = `
                UPDATE horarios 
                SET ${updateFields.join(', ')}
                WHERE id_horario = ?
            `;

            await executeQuery(query, updateValues);

            // Auditar acción
            await auditAction(req, 'horarios', 'UPDATE', horario, req.body, null);

            res.json({
                success: true,
                message: 'Horario actualizado exitosamente'
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Eliminar horario
     */
    async eliminarHorario(req, res, next) {
        try {
            const { id } = req.params;

            const horarioExistente = await executeQuery(
                'SELECT * FROM horarios WHERE id_horario = ?',
                [id]
            );

            if (horarioExistente.length === 0) {
                throw createError('Horario no encontrado', 404);
            }

            await executeQuery('DELETE FROM horarios WHERE id_horario = ?', [id]);

            // Auditar acción
            await auditAction(req, 'horarios', 'DELETE', horarioExistente[0], null, null);

            res.json({
                success: true,
                message: 'Horario eliminado exitosamente'
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtener horario de un estudiante
     */
    async obtenerHorarioEstudiante(req, res, next) {
        try {
            const { id_estudiante } = req.params;
            const { gestion, periodo } = req.query;

            if (!gestion || !periodo) {
                throw createError('Gestión y periodo son requeridos', 400);
            }

            const query = `
                SELECT 
                    h.*,
                    m.nombre as materia_nombre,
                    m.sigla as materia_sigla,
                    m.semestre,
                    CONCAT(d.nombre, ' ', d.apellido) as docente_nombre,
                    i.paralelo as paralelo_inscrito
                FROM inscripciones i
                INNER JOIN horarios h ON i.id_materia = h.id_materia 
                    AND i.gestion = h.gestion 
                    AND i.periodo = h.periodo
                    AND i.paralelo = h.paralelo
                INNER JOIN materias m ON i.id_materia = m.id_materia
                INNER JOIN docentes d ON h.id_docente = d.id_docente
                WHERE i.id_estudiante = ?
                    AND i.gestion = ?
                    AND i.periodo = ?
                    AND i.estado = 'inscrito'
                    AND h.activo = TRUE
                ORDER BY FIELD(h.dia_semana, 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'),
                    h.hora_inicio
            `;

            const horarios = await executeQuery(query, [id_estudiante, gestion, periodo]);

            // Agrupar por día
            const horarioPorDia = {};
            const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            
            diasSemana.forEach(dia => {
                horarioPorDia[dia] = horarios.filter(h => h.dia_semana === dia);
            });

            res.json({
                success: true,
                data: {
                    horarios,
                    horarioPorDia,
                    resumen: {
                        total_clases: horarios.length,
                        materias_inscritas: [...new Set(horarios.map(h => h.id_materia))].length
                    }
                }
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Verificar conflictos de horario para inscripción
     */
    async verificarConflictosInscripcion(req, res, next) {
        try {
            const { id_estudiante, id_materia } = req.params;
            const { gestion, periodo, paralelo = 'A' } = req.query;

            if (!gestion || !periodo) {
                throw createError('Gestión y periodo son requeridos', 400);
            }

            // Obtener horarios de la materia a inscribir
            const horariosMateria = await executeQuery(
                `SELECT * FROM horarios 
                 WHERE id_materia = ? AND gestion = ? AND periodo = ? AND paralelo = ? AND activo = TRUE`,
                [id_materia, gestion, periodo, paralelo]
            );

            if (horariosMateria.length === 0) {
                return res.json({
                    success: true,
                    data: {
                        tiene_conflictos: false,
                        mensaje: 'La materia no tiene horarios asignados'
                    }
                });
            }

            // Buscar conflictos con materias ya inscritas
            const conflictosQuery = `
                SELECT 
                    h1.*,
                    m.nombre as materia_nombre,
                    m.sigla as materia_sigla
                FROM horarios h1
                INNER JOIN inscripciones i ON h1.id_materia = i.id_materia 
                    AND h1.gestion = i.gestion 
                    AND h1.periodo = i.periodo
                    AND h1.paralelo = i.paralelo
                INNER JOIN materias m ON i.id_materia = m.id_materia
                WHERE i.id_estudiante = ?
                    AND i.gestion = ?
                    AND i.periodo = ?
                    AND i.estado = 'inscrito'
                    AND h1.activo = TRUE
                    AND EXISTS (
                        SELECT 1 FROM horarios h2
                        WHERE h2.id_materia = ?
                            AND h2.gestion = ?
                            AND h2.periodo = ?
                            AND h2.paralelo = ?
                            AND h2.dia_semana = h1.dia_semana
                            AND h2.activo = TRUE
                            AND (
                                (h2.hora_inicio < h1.hora_fin AND h2.hora_fin > h1.hora_inicio)
                            )
                    )
            `;

            const conflictos = await executeQuery(conflictosQuery, [
                id_estudiante, gestion, periodo,
                id_materia, gestion, periodo, paralelo
            ]);

            res.json({
                success: true,
                data: {
                    tiene_conflictos: conflictos.length > 0,
                    conflictos: conflictos,
                    horarios_materia: horariosMateria
                }
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Métodos auxiliares privados
     */
    async verificarConflictoHorarioDocente(id_docente, gestion, periodo, dia_semana, hora_inicio, hora_fin, excluir_id = null) {
        let query = `
            SELECT h.*, m.nombre as materia_nombre
            FROM horarios h
            INNER JOIN materias m ON h.id_materia = m.id_materia
            WHERE h.id_docente = ?
                AND h.gestion = ?
                AND h.periodo = ?
                AND h.dia_semana = ?
                AND h.activo = TRUE
                AND (
                    (? < h.hora_fin AND ? > h.hora_inicio)
                )
        `;
        
        const params = [id_docente, gestion, periodo, dia_semana, hora_inicio, hora_fin];
        
        if (excluir_id) {
            query += ' AND h.id_horario != ?';
            params.push(excluir_id);
        }

        const conflictos = await executeQuery(query, params);
        return conflictos.length > 0 ? conflictos[0] : null;
    }

    async verificarConflictoAula(aula, gestion, periodo, dia_semana, hora_inicio, hora_fin, excluir_id = null) {
        let query = `
            SELECT h.*, m.nombre as materia_nombre, CONCAT(d.nombre, ' ', d.apellido) as docente_nombre
            FROM horarios h
            INNER JOIN materias m ON h.id_materia = m.id_materia
            INNER JOIN docentes d ON h.id_docente = d.id_docente
            WHERE h.aula = ?
                AND h.gestion = ?
                AND h.periodo = ?
                AND h.dia_semana = ?
                AND h.activo = TRUE
                AND (
                    (? < h.hora_fin AND ? > h.hora_inicio)
                )
        `;
        
        const params = [aula, gestion, periodo, dia_semana, hora_inicio, hora_fin];
        
        if (excluir_id) {
            query += ' AND h.id_horario != ?';
            params.push(excluir_id);
        }

        const conflictos = await executeQuery(query, params);
        return conflictos.length > 0 ? conflictos[0] : null;
    }
}

const controller = new HorarioController();

module.exports = {
    listarHorarios: controller.listarHorarios.bind(controller),
    obtenerHorario: controller.obtenerHorario.bind(controller),
    crearHorario: controller.crearHorario.bind(controller),
    actualizarHorario: controller.actualizarHorario.bind(controller),
    eliminarHorario: controller.eliminarHorario.bind(controller),
    obtenerHorarioEstudiante: controller.obtenerHorarioEstudiante.bind(controller),
    verificarConflictosInscripcion: controller.verificarConflictosInscripcion.bind(controller)
};
