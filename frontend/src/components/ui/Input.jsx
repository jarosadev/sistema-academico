import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

const Input = forwardRef(({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  disabled = false,
  required = false,
  error,
  helperText,
  icon,
  className = '',
  inputClassName = '',
  size = 'md',
  variant = 'default',
  autoComplete,
  autoFocus = false,
  maxLength,
  minLength,
  pattern,
  step,
  min,
  max,
  rows,
  cols,
  readOnly = false,
  ...props
}, ref) => {
  const baseInputClasses = `
    w-full rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2
    ${disabled ? 'cursor-not-allowed opacity-50' : ''}
    ${readOnly ? 'cursor-default' : ''}
  `;

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-5 py-4 text-lg'
  };

  const variantClasses = {
    default: `
      border-secondary-300 bg-white text-secondary-900 placeholder-secondary-400
      focus:border-primary-500 focus:ring-primary-500/20
      ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
    `,
    filled: `
      border-transparent bg-secondary-100 text-secondary-900 placeholder-secondary-500
      focus:bg-white focus:border-primary-500 focus:ring-primary-500/20
      ${error ? 'bg-red-50 border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
    `,
    outlined: `
      border-2 border-secondary-300 bg-transparent text-secondary-900 placeholder-secondary-400
      focus:border-primary-500 focus:ring-primary-500/10
      ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}
    `
  };

  const inputClasses = `
    ${baseInputClasses}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${icon ? 'pl-12' : ''}
    ${inputClassName}
  `;

  const InputComponent = type === 'textarea' ? 'textarea' : 'input';

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

      {/* Input Container */}
      <div className="relative">
        {/* Icon */}
        {icon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400">
            {React.cloneElement(icon, { 
              className: `w-5 h-5 ${icon.props.className || ''}` 
            })}
          </div>
        )}

        {/* Input Field */}
        <InputComponent
          ref={ref}
          id={name}
          name={name}
          type={type !== 'textarea' ? type : undefined}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          maxLength={maxLength}
          minLength={minLength}
          pattern={pattern}
          step={step}
          min={min}
          max={max}
          rows={type === 'textarea' ? rows || 4 : undefined}
          cols={type === 'textarea' ? cols : undefined}
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
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-red-500">
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

Input.displayName = 'Input';

// Componentes especializados
export const TextInput = (props) => <Input type="text" {...props} />;
export const EmailInput = (props) => <Input type="email" {...props} />;
export const PasswordInput = (props) => <Input type="password" {...props} />;
export const NumberInput = (props) => <Input type="number" {...props} />;
export const DateInput = (props) => <Input type="date" {...props} />;
export const TimeInput = (props) => <Input type="time" {...props} />;
export const DateTimeInput = (props) => <Input type="datetime-local" {...props} />;
export const TelInput = (props) => <Input type="tel" {...props} />;
export const UrlInput = (props) => <Input type="url" {...props} />;
export const SearchInput = (props) => <Input type="search" {...props} />;
export const TextArea = (props) => <Input type="textarea" {...props} />;

// Componente de grupo de inputs
export const InputGroup = ({ children, className = '', label, error, helperText }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-secondary-700">
          {label}
        </label>
      )}
      <div className="flex space-x-2">
        {children}
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-secondary-500">{helperText}</p>
      )}
    </div>
  );
};

// Componente de input con addon
export const InputWithAddon = ({ 
  leftAddon, 
  rightAddon, 
  children, 
  className = '' 
}) => {
  return (
    <div className={`flex ${className}`}>
      {leftAddon && (
        <div className="flex items-center px-3 bg-secondary-50 border border-r-0 border-secondary-300 rounded-l-lg text-secondary-500">
          {leftAddon}
        </div>
      )}
      {React.cloneElement(children, {
        className: `${children.props.className || ''} ${
          leftAddon ? 'rounded-l-none' : ''
        } ${rightAddon ? 'rounded-r-none' : ''}`
      })}
      {rightAddon && (
        <div className="flex items-center px-3 bg-secondary-50 border border-l-0 border-secondary-300 rounded-r-lg text-secondary-500">
          {rightAddon}
        </div>
      )}
    </div>
  );
};

export default Input;
