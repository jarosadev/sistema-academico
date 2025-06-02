import axios from 'axios';
import { notificationService } from './notificationService';

// Configuración base de axios
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Variable to track if session expiration is being handled
let isHandlingExpiration = false;
const SESSION_EXPIRED_TOAST_ID = 'session-expired';

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Function to show session expired message and redirect
const handleSessionExpiration = () => {
  // Prevent multiple handlers from running simultaneously
  if (isHandlingExpiration) return;
  isHandlingExpiration = true;

  // Remove token
  localStorage.removeItem('token');
  
  // Dismiss all existing toasts
  notificationService.dismiss();
  
  // Show single error notification with unique ID and longer duration
  notificationService.error('Su sesión ha expirado', {
    id: SESSION_EXPIRED_TOAST_ID,
    duration: 3000,
    position: 'top-center',
    important: true,
    description: 'Por favor, inicie sesión nuevamente.',
    onDismiss: () => {
      // Reset flag when toast is dismissed
      isHandlingExpiration = false;
    }
  });

  // Set a flag to prevent further error notifications
  window.__isSessionExpired = true;

  // Remove existing overlay if any
  const existingOverlay = document.getElementById('session-expired-overlay');
  if (existingOverlay) {
    existingOverlay.remove();
  }

  // Add loading overlay with improved styling
  const overlay = document.createElement('div');
  overlay.id = 'session-expired-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    backdrop-filter: blur(4px);
  `;

  // Create message container
  const messageContainer = document.createElement('div');
  messageContainer.style.cssText = `
    background-color: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    text-align: center;
    margin-bottom: 1.5rem;
    max-width: 90%;
    width: 400px;
  `;

  const message = document.createElement('h2');
  message.textContent = 'Sesión Expirada';
  message.style.cssText = `
    color: #1a1a1a;
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1rem;
  `;

  const subMessage = document.createElement('p');
  subMessage.textContent = 'Redirigiendo al inicio de sesión...';
  subMessage.style.cssText = `
    color: #666;
    font-size: 1rem;
  `;

  messageContainer.appendChild(message);
  messageContainer.appendChild(subMessage);

  // Create spinner with improved styling
  const spinner = document.createElement('div');
  spinner.style.cssText = `
    width: 40px;
    height: 40px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 1rem auto 0;
    display: block;
  `;

  // Add animation
  const style = document.createElement('style');
  style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
  document.head.appendChild(style);

  messageContainer.appendChild(spinner);
  overlay.appendChild(messageContainer);
  document.body.appendChild(overlay);

  // Redirect after delay and cleanup
  setTimeout(() => {
    isHandlingExpiration = false;
    window.location.href = '/login';
  }, 3000);
};

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    // Si es una respuesta blob (para descargas), retornar response.data directamente
    if (response.config.responseType === 'blob') {
      return response.data;
    }
    // Para otras respuestas, retornar el data procesado
    return response.data;
  },
  (error) => {
    // Don't show session expired for login endpoint
    const isLoginRequest = error.config?.url === '/auth/login';
    
    // Handle session expiration only for non-login requests
    if (error.response?.status === 401 && !isLoginRequest && !isHandlingExpiration) {
      handleSessionExpiration();
    }
    
    // Don't show additional error notifications if session is expired
    if (window.__isSessionExpired) {
      return Promise.reject({
        ...error,
        suppressNotification: true // Add flag to suppress notifications
      });
    }

    // Propagate error with additional info
    return Promise.reject({
      ...error,
      message: error.response?.data?.message || 'Error de conexión',
      status: error.response?.status,
      timestamp: new Date().toISOString(),
      suppressNotification: false
    });
  }
);

export default api;
