import api from './api';

export const estudianteService = {
  // Listar estudiantes con paginación y filtros
  listarEstudiantes: async (params) => {
    const response = await api.get('/estudiantes', { params });
    return response;
  },

  // Obtener un estudiante por ID
  obtenerEstudiante: async (id) => {
    const response = await api.get(`/estudiantes/${id}`);
    return response;
  },

  // Crear un nuevo estudiante
  crearEstudiante: async (data) => {
    const response = await api.post('/estudiantes', data);
    return response;
  },

  // Actualizar un estudiante
  actualizarEstudiante: async (id, data) => {
    const response = await api.put(`/estudiantes/${id}`, data);
    return response;
  },

  // Eliminar un estudiante (soft delete)
  eliminarEstudiante: async (id) => {
    const response = await api.delete(`/estudiantes/${id}`);
    return response;
  },

  // Obtener estadísticas de estudiantes
  obtenerEstadisticas: async () => {
    const response = await api.get('/estudiantes/estadisticas');
    return response;
  },

  // Obtener historial académico
  obtenerHistorialAcademico: async (id) => {
    const response = await api.get(`/estudiantes/${id}/historial`);
    return response;
  },

  // Obtener inscripciones por estudiante
  obtenerInscripciones: async (id) => {
    const response = await api.get(`/estudiantes/${id}/inscripciones`);
    return response;
  },

  // Obtener notas por estudiante
  obtenerNotas: async (id) => {
    const response = await api.get(`/estudiantes/${id}/notas`);
    return response;
  },

  // Cambiar estado académico
  cambiarEstadoAcademico: async (id, estado) => {
    const response = await api.patch(`/estudiantes/${id}/estado`, { estado });
    return response;
  }
};
