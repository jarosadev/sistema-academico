import api from './api';

export const authService = {
  // Iniciar sesión
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Registrar usuario
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Cerrar sesión
  logout: async () => {
    try {
      const response = await api.post('/auth/logout');
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Verificar token
  verifyToken: async () => {
    try {
      const response = await api.get('/auth/verify');
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Obtener perfil
  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile');
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Cambiar contraseña
  changePassword: async (passwordData) => {
    try {
      const response = await api.put('/auth/change-password', passwordData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Refrescar token
  refreshToken: async (refreshToken) => {
    try {
      const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Obtener sesiones activas
  getActiveSessions: async () => {
    try {
      const response = await api.get('/auth/sessions');
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Cerrar sesión específica
  logoutSession: async (sessionId) => {
    try {
      const response = await api.delete(`/auth/sessions/${sessionId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Cerrar todas las sesiones
  logoutAll: async () => {
    try {
      const response = await api.post('/auth/logout-all');
      return response;
    } catch (error) {
      throw error;
    }
  }
};
