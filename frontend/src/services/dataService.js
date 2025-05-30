import api from './api';

/**
 * Servicio de datos para la aplicación
 * Proporciona métodos para interactuar con la API del backend
 * Todos los métodos están en español para consistencia
 */
export const dataService = {
  // Gestión de Estudiantes
  estudiantes: {
    // Operaciones CRUD básicas
    obtenerTodos: (parametros = {}) => api.get('/estudiantes', { params: parametros }),
    obtenerPorId: (id) => api.get(`/estudiantes/${id}`),
    crear: (datos) => api.post('/estudiantes', datos),
    actualizar: (id, datos) => api.put(`/estudiantes/${id}`, datos),
    eliminar: (id) => api.delete(`/estudiantes/${id}`),
    
    // Operaciones específicas
    obtenerEstadisticas: () => api.get('/estudiantes/estadisticas'),
    obtenerInscripciones: (id) => api.get(`/estudiantes/${id}/inscripciones`),
    obtenerNotas: (id) => api.get(`/estudiantes/${id}/notas`),
    obtenerHistorialAcademico: (id) => api.get(`/estudiantes/${id}/historial`),
    obtenerPorMencion: (idMencion) => api.get(`/estudiantes/mencion/${idMencion}`),
    
    // Operaciones masivas y especiales
    importarEstudiantes: (datos) => api.post('/estudiantes/importar', datos),
    cambiarEstadoAcademico: (id, estado) => api.put(`/estudiantes/${id}/estado`, { estado }),
    
    // Métodos de compatibilidad (para no romper código existente)
    getAll: (params = {}) => api.get('/estudiantes', { params }),
    getById: (id) => api.get(`/estudiantes/${id}`),
    create: (data) => api.post('/estudiantes', data),
    update: (id, data) => api.put(`/estudiantes/${id}`, data),
    delete: (id) => api.delete(`/estudiantes/${id}`),
    getEstadisticas: () => api.get('/estudiantes/estadisticas'),
    getInscripciones: (id) => api.get(`/estudiantes/${id}/inscripciones`),
    getNotas: (id) => api.get(`/estudiantes/${id}/notas`),
    importar: (data) => api.post('/estudiantes/importar', data),
    cambiarEstado: (id, estado) => api.put(`/estudiantes/${id}/estado`, { estado })
  },

  // Gestión de Docentes
  docentes: {
    // Operaciones CRUD básicas
    obtenerTodos: (parametros = {}) => api.get('/docentes', { params: parametros }),
    obtenerPorId: (id) => api.get(`/docentes/${id}`),
    crear: (datos) => api.post('/docentes', datos),
    actualizar: (id, datos) => api.put(`/docentes/${id}`, datos),
    eliminar: (id) => api.delete(`/docentes/${id}`),
    
    // Operaciones específicas
    obtenerEstadisticas: () => api.get('/docentes/estadisticas'),
    obtenerMaterias: (id) => api.get(`/docentes/${id}/materias`),
    obtenerEstudiantes: (id) => api.get(`/docentes/${id}/estudiantes`),
    obtenerCargaAcademica: (id) => api.get(`/docentes/${id}/carga-academica`),
    obtenerPorEspecialidad: (especialidad) => api.get(`/docentes/especialidad/${especialidad}`),
    
    // Gestión de materias
    asignarMateria: (id, datosMateria) => api.post(`/docentes/${id}/materias`, datosMateria),
    desasignarMateria: (id, idMateria) => api.delete(`/docentes/${id}/materias/${idMateria}`),
    asignacionMasiva: (datos) => api.post('/docentes/asignacion-masiva', datos),
    
    // Métodos de compatibilidad
    getAll: (params = {}) => api.get('/docentes', { params }),
    getById: (id) => api.get(`/docentes/${id}`),
    create: (data) => api.post('/docentes', data),
    update: (id, data) => api.put(`/docentes/${id}`, data),
    delete: (id) => api.delete(`/docentes/${id}`),
    getEstadisticas: () => api.get('/docentes/estadisticas'),
    getMaterias: (id) => api.get(`/docentes/${id}/materias`),
    getEstudiantes: (id) => api.get(`/docentes/${id}/estudiantes`),
    getCargaAcademica: (id) => api.get(`/docentes/${id}/carga-academica`)
  },

  // Gestión de Materias
  materias: {
    // Operaciones CRUD básicas
    obtenerTodas: (parametros = {}) => api.get('/materias', { params: parametros }),
    obtenerPorId: (id) => api.get(`/materias/${id}`),
    crear: (datos) => api.post('/materias', datos),
    actualizar: (id, datos) => api.put(`/materias/${id}`, datos),
    eliminar: (id) => api.delete(`/materias/${id}`),
    
    // Operaciones específicas
    obtenerEstadisticas: () => api.get('/materias/estadisticas'),
    obtenerPorMencion: (idMencion) => api.get(`/materias/mencion/${idMencion}`),
    obtenerPorSemestre: (semestre) => api.get(`/materias/semestre/${semestre}`),
    obtenerInscripciones: (id) => api.get(`/materias/${id}/inscripciones`),
    obtenerDocentes: (id) => api.get(`/materias/${id}/docentes`),
    
    // Métodos de compatibilidad
    getAll: (params = {}) => api.get('/materias', { params }),
    getById: (id) => api.get(`/materias/${id}`),
    create: (data) => api.post('/materias', data),
    update: (id, data) => api.put(`/materias/${id}`, data),
    delete: (id) => api.delete(`/materias/${id}`),
    getEstadisticas: () => api.get('/materias/estadisticas'),
    getByMencion: (mencionId) => api.get(`/materias/mencion/${mencionId}`),
    getBySemestre: (semestre) => api.get(`/materias/semestre/${semestre}`),
    getInscripciones: (id) => api.get(`/materias/${id}/inscripciones`),
    getDocentes: (id) => api.get(`/materias/${id}/docentes`)
  },

  // Gestión de Menciones
  menciones: {
    // Operaciones CRUD básicas
    obtenerTodas: (parametros = {}) => api.get('/menciones', { params: parametros }),
    obtenerPorId: (id) => api.get(`/menciones/${id}`),
    crear: (datos) => api.post('/menciones', datos),
    actualizar: (id, datos) => api.put(`/menciones/${id}`, datos),
    eliminar: (id) => api.delete(`/menciones/${id}`),
    
    // Operaciones específicas
    obtenerEstadisticas: () => api.get('/menciones/estadisticas'),
    obtenerMaterias: (id) => api.get(`/menciones/${id}/materias`),
    obtenerEstudiantes: (id) => api.get(`/menciones/${id}/estudiantes`),
    
    // Métodos de compatibilidad
    getAll: (params = {}) => api.get('/menciones', { params }),
    getById: (id) => api.get(`/menciones/${id}`),
    create: (data) => api.post('/menciones', data),
    update: (id, data) => api.put(`/menciones/${id}`, data),
    delete: (id) => api.delete(`/menciones/${id}`),
    getEstadisticas: () => api.get('/menciones/estadisticas'),
    getMaterias: (id) => api.get(`/menciones/${id}/materias`),
    getEstudiantes: (id) => api.get(`/menciones/${id}/estudiantes`)
  },

  // Gestión de Inscripciones
  inscripciones: {
    // Operaciones CRUD básicas
    obtenerTodas: (parametros = {}) => api.get('/inscripciones', { params: parametros }),
    obtenerPorId: (id) => api.get(`/inscripciones/${id}`),
    crear: (datos) => api.post('/inscripciones', datos),
    actualizar: (id, datos) => api.put(`/inscripciones/${id}`, datos),
    eliminar: (id) => api.delete(`/inscripciones/${id}`),
    
    // Operaciones específicas
    obtenerEstadisticas: () => api.get('/inscripciones/estadisticas'),
    obtenerPorEstudiante: (idEstudiante) => api.get(`/inscripciones/estudiante/${idEstudiante}`),
    obtenerPorMateria: (idMateria) => api.get(`/inscripciones/materia/${idMateria}`),
    obtenerPorGestion: (gestion) => api.get(`/inscripciones/gestion/${gestion}`),
    
    // Operaciones masivas
    inscripcionMasiva: (datos) => api.post('/inscripciones/masiva', datos),
    cambiarEstado: (id, estado) => api.put(`/inscripciones/${id}/estado`, { estado }),
    
    // Métodos de compatibilidad
    getAll: (params = {}) => api.get('/inscripciones', { params }),
    getById: (id) => api.get(`/inscripciones/${id}`),
    create: (data) => api.post('/inscripciones', data),
    update: (id, data) => api.put(`/inscripciones/${id}`, data),
    delete: (id) => api.delete(`/inscripciones/${id}`),
    getEstadisticas: () => api.get('/inscripciones/estadisticas'),
    getByEstudiante: (estudianteId) => api.get(`/inscripciones/estudiante/${estudianteId}`),
    getByMateria: (materiaId) => api.get(`/inscripciones/materia/${materiaId}`),
    getByGestion: (gestion) => api.get(`/inscripciones/gestion/${gestion}`)
  },

  // Gestión de Notas
  notas: {
    // Operaciones CRUD básicas
    obtenerTodas: (parametros = {}) => api.get('/notas', { params: parametros }),
    obtenerPorId: (id) => api.get(`/notas/${id}`),
    crear: (datos) => api.post('/notas', datos),
    actualizar: (id, datos) => api.put(`/notas/${id}`, datos),
    eliminar: (id) => api.delete(`/notas/${id}`),
    
    // Operaciones específicas
    obtenerEstadisticas: () => api.get('/notas/estadisticas'),
    obtenerPorInscripcion: (idInscripcion) => api.get(`/notas/inscripcion/${idInscripcion}`),
    obtenerPorEstudiante: (idEstudiante) => api.get(`/notas/estudiante/${idEstudiante}`),
    obtenerPorMateria: (idMateria) => api.get(`/notas/materia/${idMateria}`),
    obtenerPorDocente: (idDocente) => api.get(`/notas/docente/${idDocente}`),
    
    // Operaciones de cálculo
    calcularPromedio: (idEstudiante, gestion) => api.get(`/notas/promedio/${idEstudiante}/${gestion}`),
    registroMasivo: (datos) => api.post('/notas/masivo', datos),
    
    // Métodos de compatibilidad
    getAll: (params = {}) => api.get('/notas', { params }),
    getById: (id) => api.get(`/notas/${id}`),
    create: (data) => api.post('/notas', data),
    update: (id, data) => api.put(`/notas/${id}`, data),
    delete: (id) => api.delete(`/notas/${id}`),
    getEstadisticas: () => api.get('/notas/estadisticas'),
    getByInscripcion: (inscripcionId) => api.get(`/notas/inscripcion/${inscripcionId}`),
    getByEstudiante: (estudianteId) => api.get(`/notas/estudiante/${estudianteId}`),
    getByMateria: (materiaId) => api.get(`/notas/materia/${materiaId}`),
    getByDocente: (docenteId) => api.get(`/notas/docente/${docenteId}`)
  },

  // Sistema de Reportes
  reportes: {
    // Operaciones básicas
    obtenerTodos: () => api.get('/reportes'),
    generar: (tipo, parametros = {}) => api.post(`/reportes/${tipo}`, parametros),
    descargar: (idReporte) => api.get(`/reportes/${idReporte}/descargar`, { responseType: 'blob' }),
    
    // Reportes específicos
    estudiantesActivos: (parametros = {}) => api.get('/reportes/estudiantes-activos', { params: parametros }),
    rendimientoAcademico: (parametros = {}) => api.get('/reportes/rendimiento-academico', { params: parametros }),
    estadisticasGenerales: () => api.get('/reportes/estadisticas-generales'),
    reporteNotas: (parametros = {}) => api.get('/reportes/notas', { params: parametros }),
    reporteInscripciones: (parametros = {}) => api.get('/reportes/inscripciones', { params: parametros }),
    reporteDocentes: (parametros = {}) => api.get('/reportes/docentes', { params: parametros }),
    
    // Métodos de compatibilidad
    getAll: () => api.get('/reportes')
  },

  // Sistema de Auditoría
  auditoria: {
    // Operaciones básicas
    obtenerLogs: (parametros = {}) => api.get('/auditoria', { params: parametros }),
    obtenerEstadisticas: (parametros = {}) => api.get('/auditoria/estadisticas', { params: parametros }),
    limpiarLogs: (dias) => api.post('/auditoria/limpiar', { dias }),
    exportarLogs: (parametros = {}) => api.get('/auditoria/exportar', { params: parametros, responseType: 'blob' }),
    
    // Métodos de compatibilidad
    getLogs: (params = {}) => api.get('/auditoria', { params }),
    getEstadisticas: (params = {}) => api.get('/auditoria/estadisticas', { params }),
    exportar: (params = {}) => api.get('/auditoria/exportar', { params, responseType: 'blob' })
  }
};

// Exportar también métodos individuales para compatibilidad
export const {
  estudiantes,
  docentes,
  materias,
  menciones,
  inscripciones,
  notas,
  reportes,
  auditoria
} = dataService;
