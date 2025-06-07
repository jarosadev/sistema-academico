import React, { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

const PasswordInput = React.forwardRef(({ 
  // Input props
  label,
  name,
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  disabled = false,
  required = false,
  error,
  helperText,
  icon = <Lock />,
  className = '',
  inputClassName = '',
  size = 'md',
  variant = 'default',
  autoComplete = 'current-password',
  autoFocus = false,
  maxLength,
  minLength,
  pattern,
  readOnly = false,
  ...props 
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  // Base classes for the input
  const baseInputClasses = `
    w-full rounded-lg border-2 transition-colors duration-200 focus:outline-none focus:ring-2
    ${disabled ? 'cursor-not-allowed opacity-50' : ''}
    ${readOnly ? 'cursor-default' : ''}
    ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-secondary-300'}
  `;

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-5 py-4 text-lg'
  };

  // Variant classes with error states
  const variantClasses = {
    default: `
      bg-white text-secondary-900 placeholder-secondary-400
      focus:border-primary-500 focus:ring-primary-500/20
      ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
    `,
    filled: `
      bg-secondary-100 text-secondary-900 placeholder-secondary-500
      focus:bg-white focus:border-primary-500 focus:ring-primary-500/20
      ${error ? 'bg-red-50 border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
    `,
    outlined: `
      bg-transparent text-secondary-900 placeholder-secondary-400
      focus:border-primary-500 focus:ring-primary-500/10
      ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}
    `
  };

  // Combined input classes
  const inputClasses = `
    ${baseInputClasses}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${icon ? 'pl-12' : ''}
    pr-10
    w-full
    ${inputClassName}
  `;

  // Handle invalid event to prevent native validation messages
  const handleInvalid = (e) => {
    e.preventDefault();
  };

  return (
    <div className={`space-y-2 w-full ${className}`}>
      {/* Label */}
      {label && (
        <label 
          htmlFor={name} 
          className={`block text-sm font-medium text-secondary-700'}`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="relative w-full flex-1">
        {/* Left Icon */}
        {icon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400">
            {React.cloneElement(icon, { 
              className: `w-5 h-5 ${icon.props.className || ''}` 
            })}
          </div>
        )}

        {/* Input Field */}
        <input
          ref={ref}
          id={name}
          name={name}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          onInvalid={handleInvalid}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          maxLength={maxLength}
          minLength={minLength}
          readOnly={readOnly}
          className={inputClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${name}-error` : helperText ? `${name}-helper` : undefined
          }
          {...props}
        />

        {/* Error Icon */}
        {error && (
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2 text-red-500">
            <AlertCircle className="w-5 h-5" />
          </div>
        )}

        {/* Eye Icon */}
        <button
          type="button"
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${error ? 'text-red-400 hover:text-red-600' : 'text-secondary-400 hover:text-secondary-600'} z-20`}
          onClick={() => setShowPassword(prev => !prev)}
          tabIndex="-1"
          disabled={disabled || readOnly}
          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
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

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;
