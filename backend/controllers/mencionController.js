const { executeQuery } = require('../config/database');
const { createError, asyncHandler } = require('../middleware/errorHandler');
const { HTTP_STATUS, MENSAJES_ERROR, MENSAJES_EXITO } = require('../config/constants');

// Crear nueva mención
const createMencion = asyncHandler(async (req, res) => {
    const { nombre, descripcion, materias_requeridas } = req.body;

    // Verificar si ya existe una mención con el mismo nombre
    const existingMencion = await executeQuery(
        'SELECT id_mencion FROM menciones WHERE nombre = ?',
        [nombre]
    );

    if (existingMencion.length > 0) {
        throw createError(
            'Ya existe una mención con ese nombre',
            HTTP_STATUS.CONFLICT,
            'MENCION_EXISTS'
        );
    }

    const query = `
        INSERT INTO menciones (nombre, descripcion, materias_requeridas) 
        VALUES (?, ?, ?)
    `;

    const result = await executeQuery(query, [nombre, descripcion, materias_requeridas || 0]);
    
    // Obtener la mención creada
    const newMencion = await executeQuery(
        'SELECT * FROM menciones WHERE id_mencion = ?',
        [result.insertId]
    );

    res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Mención creada exitosamente',
        data: newMencion[0]
    });
});

// Obtener todas las menciones - VERSIÓN FINAL SIN PARÁMETROS EN LIMIT
const getMenciones = asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
    const search = req.query.search || '';
    const activo = req.query.activo;
    
    const offset = (page - 1) * limit;

    // Construir consulta base
    let baseQuery = 'SELECT * FROM menciones';
    let countQuery = 'SELECT COUNT(*) as total FROM menciones';
    const params = [];

    // Construir condiciones WHERE
    const conditions = [];
    
    if (search && search.trim() !== '') {
        conditions.push('nombre LIKE ?');
        params.push(`%${search}%`);
    }

    if (activo !== null && activo !== '') {
        conditions.push('activo = ?');
        params.push(activo === 'true' || activo === true);
    }

    // Agregar WHERE si hay condiciones
    if (conditions.length > 0) {
        const whereClause = ' WHERE ' + conditions.join(' AND ');
        baseQuery += whereClause;
        countQuery += whereClause;
    }

    // Construir consulta final SIN parámetros para LIMIT/OFFSET
    const finalQuery = `${baseQuery} ORDER BY nombre ASC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    // Ejecutar consultas en paralelo para mejor rendimiento
    const [menciones, countResult] = await Promise.all([
        executeQuery(finalQuery, params),
        executeQuery(countQuery, params.slice(0, -2)) // Excluir limit y offset
    ]);
    
    const total = countResult[0].total;

    res.json({
        success: true,
        data: menciones,
        pagination: {
            page: page,
            limit: limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    });
});

// Obtener mención por ID
const getMencionById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const mencion = await executeQuery(
        'SELECT * FROM menciones WHERE id_mencion = ?',
        [id]
    );

    if (mencion.length === 0) {
        throw createError(
            'Mención no encontrada',
            HTTP_STATUS.NOT_FOUND,
            'MENCION_NOT_FOUND'
        );
    }

    res.json({
        success: true,
        data: mencion[0]
    });
});

// Actualizar mención
const updateMencion = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, materias_requeridas, activo } = req.body;

    // Verificar que la mención existe
    const existingMencion = await executeQuery(
        'SELECT * FROM menciones WHERE id_mencion = ?',
        [id]
    );

    if (existingMencion.length === 0) {
        throw createError(
            'Mención no encontrada',
            HTTP_STATUS.NOT_FOUND,
            'MENCION_NOT_FOUND'
        );
    }

    // Verificar nombre duplicado (excluyendo la mención actual)
    if (nombre) {
        const duplicateName = await executeQuery(
            'SELECT id_mencion FROM menciones WHERE nombre = ? AND id_mencion != ?',
            [nombre, id]
        );

        if (duplicateName.length > 0) {
            throw createError(
                'Ya existe una mención con ese nombre',
                HTTP_STATUS.CONFLICT,
                'MENCION_EXISTS'
            );
        }
    }

    const updates = [];
    const params = [];

    if (nombre !== undefined) {
        updates.push('nombre = ?');
        params.push(nombre);
    }
    if (descripcion !== undefined) {
        updates.push('descripcion = ?');
        params.push(descripcion);
    }
    if (materias_requeridas !== undefined) {
        updates.push('materias_requeridas = ?');
        params.push(materias_requeridas);
    }
    if (activo !== undefined) {
        updates.push('activo = ?');
        params.push(activo);
    }

    if (updates.length === 0) {
        throw createError(
            'No hay campos para actualizar',
            HTTP_STATUS.BAD_REQUEST,
            'NO_FIELDS_TO_UPDATE'
        );
    }

    params.push(id);
    const query = `UPDATE menciones SET ${updates.join(', ')} WHERE id_mencion = ?`;
    
    await executeQuery(query, params);

    // Obtener la mención actualizada
    const updatedMencion = await executeQuery(
        'SELECT * FROM menciones WHERE id_mencion = ?',
        [id]
    );

    res.json({
        success: true,
        message: 'Mención actualizada exitosamente',
        data: updatedMencion[0]
    });
});

// Eliminar mención (soft delete)
const deleteMencion = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Verificar que la mención existe
    const existingMencion = await executeQuery(
        'SELECT * FROM menciones WHERE id_mencion = ?',
        [id]
    );

    if (existingMencion.length === 0) {
        throw createError(
            'Mención no encontrada',
            HTTP_STATUS.NOT_FOUND,
            'MENCION_NOT_FOUND'
        );
    }

    // Verificar si hay estudiantes asociados
    const studentsCount = await executeQuery(
        'SELECT COUNT(*) as count FROM estudiantes WHERE id_mencion = ?',
        [id]
    );

    if (studentsCount[0].count > 0) {
        throw createError(
            'No se puede eliminar la mención porque tiene estudiantes asociados',
            HTTP_STATUS.CONFLICT,
            'MENCION_HAS_STUDENTS'
        );
    }

    // Soft delete
    await executeQuery(
        'UPDATE menciones SET activo = FALSE WHERE id_mencion = ?',
        [id]
    );

    res.json({
        success: true,
        message: 'Mención eliminada exitosamente'
    });
});

// Obtener estadísticas generales de menciones
const getMencionesEstadisticas = asyncHandler(async (req, res) => {
    const estadisticasQuery = `
        SELECT 
            COUNT(*) as total_menciones,
            COUNT(CASE WHEN activo = TRUE THEN 1 END) as activas,
            COUNT(CASE WHEN activo = FALSE THEN 1 END) as inactivas
        FROM menciones
    `;

    const porEstudiantesQuery = `
        SELECT 
            m.nombre as mencion,
            COUNT(e.id_estudiante) as total_estudiantes,
            COUNT(CASE WHEN e.estado_academico = 'activo' THEN 1 END) as estudiantes_activos
        FROM menciones m
        LEFT JOIN estudiantes e ON m.id_mencion = e.id_mencion
        WHERE m.activo = TRUE
        GROUP BY m.id_mencion, m.nombre
        ORDER BY total_estudiantes DESC
    `;

    const porMateriasQuery = `
        SELECT 
            m.nombre as mencion,
            COUNT(mat.id_materia) as total_materias
        FROM menciones m
        LEFT JOIN materias mat ON m.id_mencion = mat.id_mencion AND mat.activo = TRUE
        WHERE m.activo = TRUE
        GROUP BY m.id_mencion, m.nombre
        ORDER BY total_materias DESC
    `;

    const [estadisticas, porEstudiantes, porMaterias] = await Promise.all([
        executeQuery(estadisticasQuery),
        executeQuery(porEstudiantesQuery),
        executeQuery(porMateriasQuery)
    ]);

    res.json({
        success: true,
        data: {
            resumen: estadisticas[0],
            por_estudiantes: porEstudiantes,
            por_materias: porMaterias
        }
    });
});

// Obtener estadísticas de la mención
const getMencionStats = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Verificar que la mención existe
    const mencion = await executeQuery(
        'SELECT * FROM menciones WHERE id_mencion = ?',
        [id]
    );

    if (mencion.length === 0) {
        throw createError(
            'Mención no encontrada',
            HTTP_STATUS.NOT_FOUND,
            'MENCION_NOT_FOUND'
        );
    }

    // Obtener estadísticas
    const stats = await executeQuery(`
        SELECT 
            COUNT(DISTINCT e.id_estudiante) as total_estudiantes,
            COUNT(DISTINCT m.id_materia) as total_materias,
            COUNT(DISTINCT CASE WHEN e.estado_academico = 'graduado' THEN e.id_estudiante END) as estudiantes_graduados,
            COUNT(DISTINCT CASE WHEN e.estado_academico = 'activo' THEN e.id_estudiante END) as estudiantes_activos
        FROM menciones men
        LEFT JOIN estudiantes e ON men.id_mencion = e.id_mencion
        LEFT JOIN materias m ON men.id_mencion = m.id_mencion
        WHERE men.id_mencion = ?
    `, [id]);

    res.json({
        success: true,
        data: {
            mencion: mencion[0],
            estadisticas: stats[0]
        }
    });
});

module.exports = {
    createMencion,
    getMenciones,
    getMencionById,
    updateMencion,
    deleteMencion,
    getMencionStats,
    getMencionesEstadisticas
};
