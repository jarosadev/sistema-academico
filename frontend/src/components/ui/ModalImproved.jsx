import React, { useEffect, useRef, useState } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import Button from './Button';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = '',
  overlayClassName = '',
  contentClassName = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  footer,
  preventClose = false,
  fullScreenable = false,
  scrollable = true,
  centered = true,
  animation = true
}) => {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Tamaños del modal
  const sizeClasses = {
    xs: 'max-w-xs w-full mx-4',
    sm: 'max-w-sm w-full mx-4',
    md: 'max-w-md w-full mx-4',
    lg: 'max-w-lg w-full mx-4',
    xl: 'max-w-xl w-full mx-4',
    '2xl': 'max-w-2xl w-full mx-4',
    '3xl': 'max-w-3xl w-full mx-4',
    '4xl': 'max-w-4xl w-full mx-4',
    '5xl': 'max-w-5xl w-full mx-4',
    '6xl': 'max-w-6xl w-full mx-4',
    '7xl': 'max-w-7xl w-full mx-4',
    full: 'w-full h-full m-0'
  };

  // Manejar el cierre del modal
  const handleClose = () => {
    if (!preventClose) {
      if (animation) {
        setIsAnimating(true);
        setTimeout(() => {
          onClose();
          setIsAnimating(false);
        }, 150);
      } else {
        onClose();
      }
    }
  };

  // Manejar click en overlay
  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Manejar pantalla completa
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  // Manejar tecla Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (closeOnEscape && e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, closeOnEscape, preventClose]);

  // Manejar focus y scroll
  useEffect(() => {
    if (isOpen) {
      // Guardar el elemento que tenía focus
      previousFocusRef.current = document.activeElement;
      
      // Prevenir scroll del body
      document.body.style.overflow = 'hidden';
      
      // Enfocar el modal después de un pequeño delay
      setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.focus();
        }
      }, 100);
    } else {
      // Restaurar scroll del body
      document.body.style.overflow = 'unset';
      
      // Restaurar focus
      if (previousFocusRef.current && previousFocusRef.current.focus) {
        previousFocusRef.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // No renderizar si no está abierto
  if (!isOpen) return null;

  const modalSizeClass = isFullScreen ? sizeClasses.full : sizeClasses[size];
  const modalHeightClass = isFullScreen ? 'h-full' : scrollable ? 'max-h-[90vh]' : 'h-auto';
  const containerClass = centered ? 'items-center justify-center' : 'items-start justify-center pt-16';

  return (
    <div
      className={`
        fixed inset-0 z-50 overflow-y-auto
        ${animation ? 'transition-all duration-300 ease-out' : ''}
        ${isAnimating ? 'opacity-0' : 'opacity-100'}
        ${overlayClassName}
      `}
      onClick={handleOverlayClick}
    >
      {/* Overlay */}
      <div 
        className={`
          fixed inset-0 bg-black transition-opacity duration-300
          ${isAnimating ? 'bg-opacity-0' : 'bg-opacity-50'}
        `} 
      />
      
      {/* Modal Container */}
      <div className={`
        relative min-h-full flex ${containerClass} p-4
      `}>
        {/* Modal */}
        <div
          ref={modalRef}
          className={`
            relative bg-white rounded-2xl shadow-2xl flex flex-col
            ${modalSizeClass}
            ${modalHeightClass}
            ${animation ? 'transition-all duration-300 ease-out' : ''}
            ${isAnimating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
            ${isFullScreen ? 'rounded-none' : ''}
            ${className}
          `}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || showCloseButton || fullScreenable) && (
            <div className={`
              flex items-center justify-between p-4 sm:p-6 border-b border-secondary-200 bg-white flex-shrink-0
              ${isFullScreen ? 'shadow-sm' : 'rounded-t-2xl'}
              ${headerClassName}
            `}>
              {title && (
                <h2 
                  id="modal-title"
                  className="text-lg sm:text-xl font-semibold text-secondary-900 truncate pr-4"
                >
                  {title}
                </h2>
              )}
              
              <div className="flex items-center space-x-2 flex-shrink-0">
                {fullScreenable && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFullScreen}
                    className="text-secondary-500 hover:text-secondary-700"
                    aria-label={isFullScreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                  >
                    {isFullScreen ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </Button>
                )}
                
                {showCloseButton && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    disabled={preventClose}
                    className="text-secondary-500 hover:text-secondary-700"
                    aria-label="Cerrar modal"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Body */}
          <div className={`
            flex-1 p-4 sm:p-6 min-h-0
            ${scrollable ? 'overflow-y-auto' : 'overflow-hidden'}
            ${contentClassName}
            ${bodyClassName}
          `}>
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className={`
              flex flex-col sm:flex-row items-stretch sm:items-center justify-end 
              space-y-2 sm:space-y-0 sm:space-x-3 p-4 sm:p-6 
              border-t border-secondary-200 bg-secondary-50 flex-shrink-0
              ${isFullScreen ? '' : 'rounded-b-2xl'}
              ${footerClassName}
            `}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente de confirmación mejorado
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar acción',
  message = '¿Está seguro de que desea continuar?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmVariant = 'primary',
  loading = false,
  icon = null,
  ...props
}) => {
  const handleConfirm = async () => {
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error en confirmación:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      preventClose={loading}
      centered={true}
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={handleConfirm}
            loading={loading}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {confirmText}
          </Button>
        </>
      }
      {...props}
    >
      <div className="text-center">
        {icon && (
          <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
            {icon}
          </div>
        )}
        <p className="text-secondary-600 text-sm sm:text-base">{message}</p>
      </div>
    </Modal>
  );
};

// Componente de alerta mejorado
export const AlertModal = ({
  isOpen,
  onClose,
  title = 'Información',
  message,
  type = 'info',
  buttonText = 'Entendido',
  icon = null,
  ...props
}) => {
  const typeStyles = {
    info: { text: 'text-blue-600', bg: 'bg-blue-100' },
    success: { text: 'text-green-600', bg: 'bg-green-100' },
    warning: { text: 'text-yellow-600', bg: 'bg-yellow-100' },
    error: { text: 'text-red-600', bg: 'bg-red-100' }
  };

  const styles = typeStyles[type];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      centered={true}
      footer={
        <Button onClick={onClose} className="w-full sm:w-auto">
          {buttonText}
        </Button>
      }
      {...props}
    >
      <div className="text-center">
        {icon && (
          <div className={`mx-auto flex items-center justify-center w-12 h-12 rounded-full ${styles.bg} mb-4`}>
            {icon}
          </div>
        )}
        <p className={`${styles.text} text-sm sm:text-base`}>
          {message}
        </p>
      </div>
    </Modal>
  );
};

// Hook mejorado para manejar modales
export const useModal = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);
  const [data, setData] = useState(null);

  const openModal = React.useCallback((modalData = null) => {
    setData(modalData);
    setIsOpen(true);
  }, []);

  const closeModal = React.useCallback(() => {
    setIsOpen(false);
    // Limpiar data después de la animación
    setTimeout(() => setData(null), 300);
  }, []);

  const toggleModal = React.useCallback((modalData = null) => {
    if (isOpen) {
      closeModal();
    } else {
      openModal(modalData);
    }
  }, [isOpen, openModal, closeModal]);

  return {
    isOpen,
    data,
    openModal,
    closeModal,
    toggleModal,
    setIsOpen,
    setData
  };
};

export default Modal;
