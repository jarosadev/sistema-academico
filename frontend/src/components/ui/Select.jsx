import React, { forwardRef } from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';

const Select = forwardRef(({
  label,
  name,
  value,
  onChange,
  onBlur,
  onFocus,
  disabled = false,
  required = false,
  error,
  helperText,
  className = '',
  selectClassName = '',
  size = 'md',
  variant = 'default',
  children,
  ...props
}, ref) => {
  const baseSelectClasses = `
    w-full rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 appearance-none
    ${disabled ? 'cursor-not-allowed opacity-50' : ''}
  `;

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-5 py-4 text-lg'
  };

  const variantClasses = {
    default: `
      border-secondary-300 bg-white text-secondary-900
      focus:border-primary-500 focus:ring-primary-500/20
      ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
    `,
    filled: `
      border-transparent bg-secondary-100 text-secondary-900
      focus:bg-white focus:border-primary-500 focus:ring-primary-500/20
      ${error ? 'bg-red-50 border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
    `,
    outlined: `
      border-2 border-secondary-300 bg-transparent text-secondary-900
      focus:border-primary-500 focus:ring-primary-500/10
      ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}
    `
  };

  const selectClasses = `
    ${baseSelectClasses}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${selectClassName}
  `;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      {label && (
        <label 
          htmlFor={name} 
          className="block text-sm font-medium text-secondary-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Select Container */}
      <div className="relative">
        <select
          ref={ref}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          required={required}
          className={selectClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${name}-error` : helperText ? `${name}-helper` : undefined
          }
          {...props}
        >
          {children}
        </select>

        {/* Custom arrow icon */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-secondary-400">
          <ChevronDown className="w-5 h-5" />
        </div>

        {/* Error Icon */}
        {error && (
          <div className="absolute right-12 top-1/2 transform -translate-y-1/2 text-red-500">
            <AlertCircle className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p 
          id={`${name}-error`}
          className="text-sm text-red-600 flex items-center space-x-1"
        >
          <span>{error}</span>
        </p>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <p 
          id={`${name}-helper`}
          className="text-sm text-secondary-500"
        >
          {helperText}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
