import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  className = '',
  ...props
}) => {
  const baseClasses = 'btn inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'btn-primary focus:ring-primary-500',
    secondary: 'btn-secondary focus:ring-secondary-500',
    danger: 'btn-danger focus:ring-red-500',
    outline: 'border border-secondary-300 bg-white text-secondary-700 hover:bg-secondary-50 focus:ring-secondary-500',
    ghost: 'text-secondary-700 hover:bg-secondary-100 focus:ring-secondary-500',
    link: 'text-primary-600 hover:text-primary-700 underline-offset-4 hover:underline focus:ring-primary-500'
  };
  
  const sizes = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg'
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
  
  const renderIcon = (position) => {
    if (loading && position === 'left') {
      return <Loader2 className="w-4 h-4 mr-2 animate-spin" />;
    }
    
    if (icon && iconPosition === position) {
      const iconClasses = position === 'left' ? 'mr-2' : 'ml-2';
      return React.cloneElement(icon, { className: `w-4 h-4 ${iconClasses}` });
    }
    
    return null;
  };
  
  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {renderIcon('left')}
      {children}
      {renderIcon('right')}
    </button>
  );
};

export default Button;
