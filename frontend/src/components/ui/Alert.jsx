import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

const Alert = ({
  children,
  variant = 'info',
  title,
  dismissible = false,
  onDismiss,
  className = '',
  ...props
}) => {
  const variants = {
    success: {
      classes: 'alert-success',
      icon: CheckCircle
    },
    error: {
      classes: 'alert-error',
      icon: AlertCircle
    },
    warning: {
      classes: 'alert-warning',
      icon: AlertTriangle
    },
    info: {
      classes: 'alert-info',
      icon: Info
    }
  };

  const { classes, icon: Icon } = variants[variant];

  return (
    <div className={`alert ${classes} ${className}`} {...props}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-medium mb-1">
              {title}
            </h3>
          )}
          <div className="text-sm">
            {children}
          </div>
        </div>
        {dismissible && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                className="inline-flex rounded-md p-1.5 hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2"
                onClick={onDismiss}
              >
                <span className="sr-only">Cerrar</span>
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alert;
