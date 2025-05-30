// Manejo centralizado de errores
export const errorHandler = {
  // Procesar errores de API
  processApiError: (error) => {
    if (error.response) {
      // Error de respuesta del servidor
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return {
            type: 'validation',
            message: data.message || 'Datos inválidos',
            details: data.errors || []
          };
        case 401:
          return {
            type: 'auth',
            message: 'No autorizado. Por favor, inicia sesión nuevamente.',
            details: []
          };
        case 403:
          return {
            type: 'permission',
            message: 'No tienes permisos para realizar esta acción.',
            details: []
          };
        case 404:
          return {
            type: 'notFound',
            message: 'Recurso no encontrado.',
            details: []
          };
        case 409:
          return {
            type: 'conflict',
            message: data.message || 'Conflicto con los datos existentes.',
            details: []
          };
        case 422:
          return {
            type: 'validation',
            message: data.message || 'Error de validación.',
            details: data.errors || []
          };
        case 500:
          return {
            type: 'server',
            message: 'Error interno del servidor. Intenta nuevamente.',
            details: []
          };
        default:
          return {
            type: 'unknown',
            message: data.message || 'Error desconocido.',
            details: []
          };
      }
    } else if (error.request) {
      // Error de red
      return {
        type: 'network',
        message: 'Error de conexión. Verifica tu conexión a internet.',
        details: []
      };
    } else {
      // Error de configuración
      return {
        type: 'config',
        message: error.message || 'Error de configuración.',
        details: []
      };
    }
  },

  // Obtener mensaje de error amigable
  getFriendlyMessage: (error) => {
    const processedError = errorHandler.processApiError(error);
    return processedError.message;
  },

  // Verificar si es un error de autenticación
  isAuthError: (error) => {
    return error.response?.status === 401;
  },

  // Verificar si es un error de permisos
  isPermissionError: (error) => {
    return error.response?.status === 403;
  },

  // Verificar si es un error de validación
  isValidationError: (error) => {
    return error.response?.status === 400 || error.response?.status === 422;
  },

  // Obtener errores de validación específicos
  getValidationErrors: (error) => {
    if (errorHandler.isValidationError(error)) {
      return error.response?.data?.errors || {};
    }
    return {};
  }
};

// Hook personalizado para manejo de errores
export const useErrorHandler = () => {
  const handleError = (error, showToast = true) => {
    const processedError = errorHandler.processApiError(error);
    
    if (showToast) {
      // Aquí podrías integrar con una librería de toast/notificaciones
      console.error('Error:', processedError.message);
    }
    
    return processedError;
  };

  return { handleError };
};

// Utilidades para logging de errores
export const errorLogger = {
  log: (error, context = {}) => {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      context
    };
    
    // En producción, aquí enviarías el error a un servicio de logging
    console.error('Error logged:', errorInfo);
    
    // Opcional: enviar a servicio de logging externo
    // sendToLoggingService(errorInfo);
  },

  logApiError: (error, endpoint, method = 'GET') => {
    errorLogger.log(error, {
      type: 'api_error',
      endpoint,
      method,
      status: error.response?.status,
      responseData: error.response?.data
    });
  }
};
