import React from 'react';

const Card = ({
  children,
  className = '',
  variant = 'default',
  size = 'md',
  hover = false,
  clickable = false,
  onClick,
  shadow = true,
  border = true,
  rounded = true,
  ...props
}) => {
  const baseClasses = 'bg-white transition-all duration-200';
  
  const variantClasses = {
    default: 'bg-white',
    outlined: 'bg-white border-2',
    filled: 'bg-secondary-50',
    elevated: 'bg-white shadow-lg'
  };

  const sizeClasses = {
    xs: 'p-2',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };

  const classes = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${shadow ? (typeof shadow === 'string' ? shadowClasses[shadow] : 'shadow-sm') : ''}
    ${border ? 'border border-secondary-200' : ''}
    ${rounded ? 'rounded-lg' : ''}
    ${hover ? 'hover:shadow-md hover:-translate-y-0.5' : ''}
    ${clickable ? 'cursor-pointer hover:shadow-md' : ''}
    ${className}
  `;

  const Component = clickable || onClick ? 'button' : 'div';

  return (
    <Component
      className={classes}
      onClick={onClick}
      {...props}
    >
      {children}
    </Component>
  );
};

// Componentes especializados
export const CardHeader = ({ 
  children, 
  className = '', 
  divider = false,
  ...props 
}) => (
  <div 
    className={`
      ${divider ? 'border-b border-secondary-200 pb-4 mb-4' : ''}
      ${className}
    `}
    {...props}
  >
    {children}
  </div>
);

export const CardBody = ({ 
  children, 
  className = '',
  ...props 
}) => (
  <div className={className} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ 
  children, 
  className = '', 
  divider = false,
  ...props 
}) => (
  <div 
    className={`
      ${divider ? 'border-t border-secondary-200 pt-4 mt-4' : ''}
      ${className}
    `}
    {...props}
  >
    {children}
  </div>
);

export const CardTitle = ({ 
  children, 
  className = '',
  size = 'lg',
  ...props 
}) => {
  const sizeClasses = {
    sm: 'text-sm font-medium',
    md: 'text-base font-medium',
    lg: 'text-lg font-semibold',
    xl: 'text-xl font-semibold',
    '2xl': 'text-2xl font-bold'
  };

  return (
    <h3 
      className={`
        text-secondary-900 
        ${sizeClasses[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </h3>
  );
};

export const CardDescription = ({ 
  children, 
  className = '',
  ...props 
}) => (
  <p 
    className={`text-secondary-600 ${className}`}
    {...props}
  >
    {children}
  </p>
);

// Card con imagen
export const ImageCard = ({
  src,
  alt,
  imageClassName = '',
  children,
  ...props
}) => (
  <Card {...props}>
    <img 
      src={src} 
      alt={alt}
      className={`w-full h-48 object-cover rounded-t-lg ${imageClassName}`}
    />
    <div className="p-4">
      {children}
    </div>
  </Card>
);

// Card de estadística
export const StatCard = ({
  title,
  value,
  icon,
  trend,
  trendValue,
  color = 'primary',
  className = '',
  ...props
}) => {
  const colorClasses = {
    primary: 'text-primary-600 bg-primary-100',
    secondary: 'text-secondary-600 bg-secondary-100',
    success: 'text-green-600 bg-green-100',
    warning: 'text-yellow-600 bg-yellow-100',
    error: 'text-red-600 bg-red-100',
    info: 'text-blue-600 bg-blue-100'
  };

  const trendClasses = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-secondary-600'
  };

  return (
    <Card className={className} {...props}>
      <div className="flex items-center">
        {icon && (
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            {React.cloneElement(icon, { className: 'w-6 h-6' })}
          </div>
        )}
        <div className={icon ? 'ml-4' : ''}>
          <p className="text-sm font-medium text-secondary-600">{title}</p>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-secondary-900">{value}</p>
            {trend && trendValue && (
              <p className={`ml-2 text-sm font-medium ${trendClasses[trend]}`}>
                {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} {trendValue}
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

// Card de acción
export const ActionCard = ({
  title,
  description,
  action,
  icon,
  className = '',
  ...props
}) => (
  <Card 
    className={`hover:shadow-md transition-shadow ${className}`}
    {...props}
  >
    <div className="flex items-start">
      {icon && (
        <div className="flex-shrink-0">
          {React.cloneElement(icon, { 
            className: 'w-6 h-6 text-primary-600' 
          })}
        </div>
      )}
      <div className={`flex-1 ${icon ? 'ml-4' : ''}`}>
        <h3 className="text-lg font-medium text-secondary-900">{title}</h3>
        {description && (
          <p className="mt-1 text-secondary-600">{description}</p>
        )}
        {action && (
          <div className="mt-4">
            {action}
          </div>
        )}
      </div>
    </div>
  </Card>
);

// Card de lista
export const ListCard = ({
  title,
  items = [],
  renderItem,
  emptyMessage = 'No hay elementos',
  className = '',
  ...props
}) => (
  <Card className={className} {...props}>
    {title && (
      <CardHeader divider>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
    )}
    <CardBody>
      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index}>
              {renderItem ? renderItem(item, index) : item}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-secondary-500 py-4">{emptyMessage}</p>
      )}
    </CardBody>
  </Card>
);

// Asignar los componentes como propiedades del Card principal
Card.Header = CardHeader;
Card.Content = CardBody; // CardBody se mapea a Card.Content
Card.Footer = CardFooter;
Card.Title = CardTitle;
Card.Description = CardDescription;

export default Card;
