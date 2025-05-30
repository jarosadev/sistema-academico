import React from 'react';
import { Loader2 } from 'lucide-react';

const Loading = ({
  size = 'md',
  variant = 'spinner',
  color = 'primary',
  text,
  fullScreen = false,
  overlay = false,
  className = '',
  ...props
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
    '2xl': 'w-16 h-16'
  };

  const colorClasses = {
    primary: 'text-primary-600',
    secondary: 'text-secondary-600',
    white: 'text-white',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    info: 'text-blue-600'
  };

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl'
  };

  // Componente Spinner
  const Spinner = () => (
    <Loader2 
      className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}
      {...props}
    />
  );

  // Componente Dots
  const Dots = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`
            rounded-full animate-pulse
            ${sizeClasses[size]} 
            ${colorClasses[color].replace('text-', 'bg-')}
          `}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  );

  // Componente Pulse
  const Pulse = () => (
    <div className="flex space-x-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`
            w-1 rounded-full animate-pulse
            ${colorClasses[color].replace('text-', 'bg-')}
          `}
          style={{
            height: size === 'xs' ? '12px' : size === 'sm' ? '16px' : size === 'md' ? '20px' : size === 'lg' ? '24px' : '32px',
            animationDelay: `${i * 0.1}s`,
            animationDuration: '1.2s'
          }}
        />
      ))}
    </div>
  );

  // Componente Wave
  const Wave = () => (
    <div className="flex items-end space-x-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`
            w-1 rounded-full animate-bounce
            ${colorClasses[color].replace('text-', 'bg-')}
          `}
          style={{
            height: size === 'xs' ? '8px' : size === 'sm' ? '12px' : size === 'md' ? '16px' : size === 'lg' ? '20px' : '24px',
            animationDelay: `${i * 0.1}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  );

  // Componente Ring
  const Ring = () => (
    <div 
      className={`
        animate-spin rounded-full border-2 border-transparent
        ${sizeClasses[size]}
        ${colorClasses[color].replace('text-', 'border-t-')}
      `}
      style={{
        borderTopColor: 'currentColor',
        borderRightColor: 'transparent',
        borderBottomColor: 'transparent',
        borderLeftColor: 'transparent'
      }}
    />
  );

  // Seleccionar el componente de loading
  const LoadingComponent = () => {
    switch (variant) {
      case 'dots':
        return <Dots />;
      case 'pulse':
        return <Pulse />;
      case 'wave':
        return <Wave />;
      case 'ring':
        return <Ring />;
      case 'spinner':
      default:
        return <Spinner />;
    }
  };

  // Contenido del loading
  const LoadingContent = () => (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      <LoadingComponent />
      {text && (
        <p className={`font-medium ${colorClasses[color]} ${textSizeClasses[size]}`}>
          {text}
        </p>
      )}
    </div>
  );

  // Loading de pantalla completa
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <LoadingContent />
      </div>
    );
  }

  // Loading con overlay
  if (overlay) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-75">
        <LoadingContent />
      </div>
    );
  }

  // Loading normal
  return <LoadingContent />;
};

// Componentes especializados
export const SpinnerLoading = (props) => <Loading variant="spinner" {...props} />;
export const DotsLoading = (props) => <Loading variant="dots" {...props} />;
export const PulseLoading = (props) => <Loading variant="pulse" {...props} />;
export const WaveLoading = (props) => <Loading variant="wave" {...props} />;
export const RingLoading = (props) => <Loading variant="ring" {...props} />;

// Loading para botones
export const ButtonLoading = ({ size = 'sm', color = 'white', ...props }) => (
  <Loading size={size} color={color} variant="spinner" {...props} />
);

// Loading para páginas
export const PageLoading = ({ text = 'Cargando...', ...props }) => (
  <Loading 
    size="lg" 
    text={text} 
    fullScreen 
    {...props} 
  />
);

// Loading para secciones
export const SectionLoading = ({ text = 'Cargando...', ...props }) => (
  <div className="flex items-center justify-center py-12">
    <Loading size="md" text={text} {...props} />
  </div>
);

// Loading para tablas
export const TableLoading = ({ rows = 5, columns = 4 }) => (
  <div className="animate-pulse">
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4 py-3">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <div 
            key={colIndex} 
            className="h-4 bg-secondary-200 rounded flex-1"
          />
        ))}
      </div>
    ))}
  </div>
);

// Loading para cards
export const CardLoading = ({ 
  showImage = false, 
  lines = 3,
  className = '' 
}) => (
  <div className={`animate-pulse p-4 ${className}`}>
    {showImage && (
      <div className="h-48 bg-secondary-200 rounded mb-4" />
    )}
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, index) => (
        <div 
          key={index}
          className="h-4 bg-secondary-200 rounded"
          style={{ 
            width: index === lines - 1 ? '75%' : '100%' 
          }}
        />
      ))}
    </div>
  </div>
);

// Loading para listas
export const ListLoading = ({ items = 5, showAvatar = false }) => (
  <div className="animate-pulse space-y-4">
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="flex items-center space-x-4">
        {showAvatar && (
          <div className="w-10 h-10 bg-secondary-200 rounded-full" />
        )}
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-secondary-200 rounded w-3/4" />
          <div className="h-3 bg-secondary-200 rounded w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

// Hook para manejar estados de loading
export const useLoading = (initialState = false) => {
  const [loading, setLoading] = React.useState(initialState);

  const startLoading = React.useCallback(() => {
    setLoading(true);
  }, []);

  const stopLoading = React.useCallback(() => {
    setLoading(false);
  }, []);

  const withLoading = React.useCallback(async (asyncFunction) => {
    startLoading();
    try {
      const result = await asyncFunction();
      return result;
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  return {
    loading,
    startLoading,
    stopLoading,
    withLoading,
    setLoading
  };
};

export default Loading;
