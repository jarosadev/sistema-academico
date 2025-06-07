import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
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
  preventClose = false
}) => {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Tamaños del modal
  const sizeClasses = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full mx-4'
  };

  // Manejar el cierre del modal
  const handleClose = () => {
    if (!preventClose) {
      onClose();
    }
  };

  // Manejar click en overlay
  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      handleClose();
    }
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
      
      // Enfocar el modal
      if (modalRef.current) {
        modalRef.current.focus();
      }
    } else {
      // Restaurar scroll del body
      document.body.style.overflow = 'unset';
      
      // Restaurar focus
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // No renderizar si no está abierto
  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 ${overlayClassName}`}
      onClick={handleOverlayClick}
    >
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
      
      {/* Modal Container */}
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          {/* Modal */}
          <div
            ref={modalRef}
            className={`
              relative bg-white rounded-lg shadow-xl max-h-[calc(100vh-2rem)] overflow-hidden
              ${sizeClasses[size]}
              ${className}
            `}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className={`
                flex items-center justify-between p-6 border-b border-secondary-200
                ${headerClassName}
              `}>
                {title && (
                  <h2 
                    id="modal-title"
                    className="text-xl font-semibold text-secondary-900"
                  >
                    {title}
                  </h2>
                )}
                
                {showCloseButton && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    disabled={preventClose}
                    className="ml-auto -mr-2"
                    aria-label="Cerrar modal"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                )}
              </div>
            )}

            {/* Body */}
            <div className={`
              flex-1 overflow-y-auto p-6
              ${bodyClassName}
            `}>
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className={`
                flex items-center justify-end space-x-3 p-6 border-t border-secondary-200 bg-secondary-50
                ${footerClassName}
              `}>
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de confirmación
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
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={handleConfirm}
            loading={loading}
            disabled={loading}
          >
            {confirmText}
          </Button>
        </>
      }
      {...props}
    >
      <p className="text-secondary-600">{message}</p>
    </Modal>
  );
};

// Componente de alerta
export const AlertModal = ({
  isOpen,
  onClose,
  title = 'Información',
  message,
  type = 'info',
  buttonText = 'Entendido',
  ...props
}) => {
  const typeStyles = {
    info: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600'
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <Button onClick={onClose}>
          {buttonText}
        </Button>
      }
      {...props}
    >
      <p className={`${typeStyles[type]} text-center`}>
        {message}
      </p>
    </Modal>
  );
};

// Hook para manejar modales
export const useModal = (initialState = false) => {
  const [isOpen, setIsOpen] = React.useState(initialState);

  const openModal = React.useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeModal = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleModal = React.useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal,
    setIsOpen
  };
};

export default Modal;
