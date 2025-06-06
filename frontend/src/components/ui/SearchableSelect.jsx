import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, ChevronDown, Search as SearchIcon, Plus } from 'lucide-react';

const SearchableSelect = ({
  label,
  name,
  value,
  onChange,
  disabled = false,
  required = false,
  error,
  helperText,
  className = '',
  size = 'md',
  variant = 'default',
  options = [],
  placeholder = 'Seleccione...',
  loading = false,
  noOptionsText = 'No hay opciones',
  allowCustom = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const containerRef = useRef(null);

  useEffect(() => {
    setFilteredOptions(
      options.filter((option) =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, options]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const baseClasses = `
    w-full rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 appearance-none
    ${disabled ? 'cursor-not-allowed opacity-50' : ''}
  `;

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-5 py-4 text-lg',
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
    `,
  };

  const inputClasses = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
  `;

  const selectedLabel = options.find((opt) => opt.value === value)?.label || (typeof value === 'object' ? '' : value) || '';

  const handleCustomValue = () => {
    if (searchTerm.trim() && !options.find(opt => opt.value === searchTerm.trim())) {
      onChange({ target: { name, value: searchTerm.trim() } });
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const showCustomOption = allowCustom && searchTerm.trim() && 
    !options.find(opt => opt.label.toLowerCase() === searchTerm.toLowerCase().trim());

  return (
    <div className={`space-y-2 relative ${className}`} ref={containerRef}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-secondary-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <button
        type="button"
        id={name}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`${inputClasses} flex justify-between items-center`}
        disabled={disabled}
      >
        <span className={`${selectedLabel ? 'text-secondary-900' : 'text-secondary-400'} block truncate`}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown className="w-5 h-5 text-secondary-400" />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-secondary-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          <div className="p-2">
            <input
              type="text"
              autoFocus
              placeholder="Buscar o escribir nueva opción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && allowCustom && searchTerm.trim()) {
                  e.preventDefault();
                  handleCustomValue();
                }
              }}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          {loading ? (
            <div className="p-4 text-center text-secondary-500">Cargando...</div>
          ) : (
            <>
              {showCustomOption && (
                <div
                  onClick={handleCustomValue}
                  className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-green-100 text-green-700 border-b border-secondary-200"
                >
                  <div className="flex items-center">
                    <Plus className="w-4 h-4 mr-2" />
                    <span>Agregar "{searchTerm.trim()}"</span>
                  </div>
                </div>
              )}
              
              {filteredOptions.length === 0 && !showCustomOption ? (
                <div className="p-4 text-center text-secondary-500">{noOptionsText}</div>
              ) : (
                <ul
                  role="listbox"
                  aria-labelledby={name}
                  tabIndex={-1}
                  className="max-h-48 overflow-auto"
                >
                  {filteredOptions.map((option) => (
                    <li
                      key={option.value}
                      role="option"
                      aria-selected={value === option.value}
                      onClick={() => {
                        onChange({ target: { name, value: option.value } });
                        setIsOpen(false);
                        setSearchTerm('');
                      }}
                      className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-primary-100 ${
                        value === option.value ? 'font-semibold text-primary-600' : 'text-secondary-900'
                      }`}
                    >
                      {option.label}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}

      {error && (
        <p id={`${name}-error`} className="text-sm text-red-600 flex items-center space-x-1 mt-1">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </p>
      )}

      {helperText && !error && (
        <p id={`${name}-helper`} className="text-sm text-secondary-500 mt-1">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default SearchableSelect;
