import { toast } from 'sonner';
import Swal from 'sweetalert2';

// Configuración de SweetAlert2
const swalConfig = {
  customClass: {
    popup: 'rounded-lg',
    title: 'text-lg font-semibold',
    content: 'text-sm text-secondary-600',
    confirmButton: 'bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md font-medium transition-colors',
    cancelButton: 'bg-secondary-200 hover:bg-secondary-300 text-secondary-700 px-4 py-2 rounded-md font-medium transition-colors mr-3',
  },
  buttonsStyling: false,
  reverseButtons: true,
};

// Servicio de notificaciones
export const notificationService = {
  // Notificaciones de éxito (Sonner)
  success: (message, options = {}) => {
    toast.success(message, {
      duration: 4000,
      position: 'top-right',
      ...options,
    });
  },

  // Notificaciones de error (Sonner)
  error: (message, options = {}) => {
    toast.error(message, {
      duration: 5000,
      position: 'top-right',
      ...options,
    });
  },

  // Notificaciones de información (Sonner)
  info: (message, options = {}) => {
    toast.info(message, {
      duration: 4000,
      position: 'top-right',
      ...options,
    });
  },

  // Notificaciones de advertencia (Sonner)
  warning: (message, options = {}) => {
    toast.warning(message, {
      duration: 4000,
      position: 'top-right',
      ...options,
    });
  },

  // Notificación de carga (Sonner)
  loading: (message, options = {}) => {
    return toast.loading(message, {
      position: 'top-right',
      ...options,
    });
  },

  // Promesa con notificación (Sonner)
  promise: (promise, messages) => {
    return toast.promise(promise, {
      loading: messages.loading || 'Procesando...',
      success: messages.success || 'Operación completada',
      error: messages.error || 'Error en la operación',
    });
  },

  // Alertas de confirmación (SweetAlert2)
  confirm: async (options = {}) => {
    const defaultOptions = {
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cancelar',
      ...swalConfig,
      ...options,
    };

    const result = await Swal.fire(defaultOptions);
    return result.isConfirmed;
  },

  // Alerta de eliminación específica
  confirmDelete: async (itemName = 'este elemento') => {
    return await notificationService.confirm({
      title: '¿Eliminar elemento?',
      text: `¿Estás seguro de que deseas eliminar ${itemName}? Esta acción no se puede deshacer.`,
      icon: 'warning',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      customClass: {
        ...swalConfig.customClass,
        confirmButton: 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors',
      },
    });
  },

  // Alerta de información (SweetAlert2)
  alert: async (options = {}) => {
    const defaultOptions = {
      title: 'Información',
      icon: 'info',
      confirmButtonText: 'Entendido',
      ...swalConfig,
      ...options,
    };

    return await Swal.fire(defaultOptions);
  },

  // Alerta de error (SweetAlert2)
  alertError: async (message, title = 'Error') => {
    return await Swal.fire({
      title,
      text: message,
      icon: 'error',
      confirmButtonText: 'Entendido',
      ...swalConfig,
    });
  },

  // Alerta de éxito (SweetAlert2)
  alertSuccess: async (message, title = 'Éxito') => {
    return await Swal.fire({
      title,
      text: message,
      icon: 'success',
      confirmButtonText: 'Continuar',
      ...swalConfig,
    });
  },

  // Input personalizado (SweetAlert2)
  input: async (options = {}) => {
    const defaultOptions = {
      title: 'Ingresa la información',
      input: 'text',
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) {
          return 'Este campo es requerido';
        }
      },
      ...swalConfig,
      ...options,
    };

    const result = await Swal.fire(defaultOptions);
    return result.isConfirmed ? result.value : null;
  },

  // Cerrar todas las notificaciones
  dismiss: () => {
    toast.dismiss();
  },

  // Cerrar notificación específica
  dismissToast: (toastId) => {
    toast.dismiss(toastId);
  },
};

// Funciones de conveniencia
export const showSuccess = notificationService.success;
export const showError = notificationService.error;
export const showInfo = notificationService.info;
export const showWarning = notificationService.warning;
export const showLoading = notificationService.loading;
export const confirmAction = notificationService.confirm;
export const confirmDelete = notificationService.confirmDelete;

export default notificationService;
