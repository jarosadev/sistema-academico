import { useState, useCallback } from 'react';

/**
 * Reglas de validación comunes
 */
export const commonRules = {
  required: (value) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return 'Este campo es requerido';
    }
    return null;
  },

  email: (value) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Ingrese un correo electrónico válido';
    }
    return null;
  },

  minLength: (min) => (value) => {
    if (!value) return null;
    if (value.length < min) {
      return `Debe tener al menos ${min} caracteres`;
    }
    return null;
  },

  maxLength: (max) => (value) => {
    if (!value) return null;
    if (value.length > max) {
      return `No debe exceder ${max} caracteres`;
    }
    return null;
  },

  phone: (value) => {
    if (!value) return null;
    const phoneRegex = /^[0-9+\-\s()]+$/;
    if (!phoneRegex.test(value) || value.length < 7) {
      return 'Ingrese un número de teléfono válido';
    }
    return null;
  },

  numeric: (value) => {
    if (!value) return null;
    if (isNaN(value)) {
      return 'Debe ser un número válido';
    }
    return null;
  },

  integer: (value) => {
    if (!value) return null;
    if (!Number.isInteger(Number(value))) {
      return 'Debe ser un número entero';
    }
    return null;
  },

  min: (min) => (value) => {
    if (!value) return null;
    if (Number(value) < min) {
      return `El valor mínimo es ${min}`;
    }
    return null;
  },

  max: (max) => (value) => {
    if (!value) return null;
    if (Number(value) > max) {
      return `El valor máximo es ${max}`;
    }
    return null;
  },

  ci: (value) => {
    if (!value) return null;
    const ciRegex = /^[0-9]{7,10}$/;
    if (!ciRegex.test(value)) {
      return 'El CI debe tener entre 7 y 10 dígitos';
    }
    return null;
  },

  date: (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return 'Ingrese una fecha válida';
    }
    return null;
  },

  pastDate: (value) => {
    if (!value) return null;
    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date >= today) {
      return 'La fecha debe ser anterior a hoy';
    }
    return null;
  },

  futureDate: (value) => {
    if (!value) return null;
    const date = new Date(value);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (date <= today) {
      return 'La fecha debe ser posterior a hoy';
    }
    return null;
  },

  match: (otherValue, fieldName) => (value) => {
    if (!value) return null;
    if (value !== otherValue) {
      return `Debe coincidir con ${fieldName}`;
    }
    return null;
  },

  url: (value) => {
    if (!value) return null;
    try {
      new URL(value);
      return null;
    } catch {
      return 'Ingrese una URL válida';
    }
  },

  alphanumeric: (value) => {
    if (!value) return null;
    const alphanumericRegex = /^[a-zA-Z0-9\s]+$/;
    if (!alphanumericRegex.test(value)) {
      return 'Solo se permiten letras, números y espacios';
    }
    return null;
  },

  noSpecialChars: (value) => {
    if (!value) return null;
    const specialCharsRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (specialCharsRegex.test(value)) {
      return 'No se permiten caracteres especiales';
    }
    return null;
  }
};

/**
 * Hook personalizado para validación de formularios
 */
export const useFormValidation = (rules = {}) => {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = useCallback((fieldName, value) => {
    const fieldRules = rules[fieldName] || [];
    let error = null;

    for (const rule of fieldRules) {
      error = rule(value);
      if (error) break;
    }

    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));

    setTouched(prev => ({
      ...prev,
      [fieldName]: true
    }));

    return !error;
  }, [rules]);

  const validate = useCallback((data) => {
    const newErrors = {};
    let isValid = true;

    Object.keys(rules).forEach(fieldName => {
      const fieldRules = rules[fieldName] || [];
      const value = data[fieldName];
      let error = null;

      for (const rule of fieldRules) {
        error = rule(value);
        if (error) break;
      }

      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    
    // Marcar todos los campos como tocados
    const allTouched = {};
    Object.keys(rules).forEach(fieldName => {
      allTouched[fieldName] = true;
    });
    setTouched(allTouched);

    return isValid;
  }, [rules]);

  const clearErrors = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  const clearFieldError = useCallback((fieldName) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  const getFieldError = useCallback((fieldName) => {
    return touched[fieldName] ? errors[fieldName] : null;
  }, [errors, touched]);

  const hasFieldError = useCallback((fieldName) => {
    return touched[fieldName] && !!errors[fieldName];
  }, [errors, touched]);

  const hasErrors = useCallback(() => {
    return Object.keys(errors).some(key => errors[key]);
  }, [errors]);

  return {
    errors,
    touched,
    validateField,
    validate,
    clearErrors,
    clearFieldError,
    getFieldError,
    hasFieldError,
    hasErrors,
    validator: {
      errors,
      touched,
      validateField,
      validate,
      clearErrors,
      clearFieldError,
      getFieldError,
      hasFieldError,
      hasErrors
    }
  };
};

/**
 * Validador de formularios sin hook (para uso en componentes de clase)
 */
export class FormValidator {
  constructor(rules = {}) {
    this.rules = rules;
    this.errors = {};
    this.touched = {};
  }

  validateField(fieldName, value) {
    const fieldRules = this.rules[fieldName] || [];
    let error = null;

    for (const rule of fieldRules) {
      error = rule(value);
      if (error) break;
    }

    this.errors[fieldName] = error;
    this.touched[fieldName] = true;

    return !error;
  }

  validate(data) {
    const newErrors = {};
    let isValid = true;

    Object.keys(this.rules).forEach(fieldName => {
      const fieldRules = this.rules[fieldName] || [];
      const value = data[fieldName];
      let error = null;

      for (const rule of fieldRules) {
        error = rule(value);
        if (error) break;
      }

      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    this.errors = newErrors;
    
    // Marcar todos los campos como tocados
    Object.keys(this.rules).forEach(fieldName => {
      this.touched[fieldName] = true;
    });

    return isValid;
  }

  getFieldError(fieldName) {
    return this.touched[fieldName] ? this.errors[fieldName] : null;
  }

  hasFieldError(fieldName) {
    return this.touched[fieldName] && !!this.errors[fieldName];
  }

  hasErrors() {
    return Object.keys(this.errors).some(key => this.errors[key]);
  }

  clearErrors() {
    this.errors = {};
    this.touched = {};
  }

  clearFieldError(fieldName) {
    delete this.errors[fieldName];
  }
}

/**
 * Funciones de utilidad para validación
 */
export const validationUtils = {
  /**
   * Combina múltiples reglas de validación
   */
  combineRules: (...rules) => (value) => {
    for (const rule of rules) {
      const error = rule(value);
      if (error) return error;
    }
    return null;
  },

  /**
   * Crea una regla de validación condicional
   */
  conditionalRule: (condition, rule) => (value, allValues) => {
    if (condition(allValues)) {
      return rule(value);
    }
    return null;
  },

  /**
   * Valida un objeto completo con reglas anidadas
   */
  validateObject: (obj, rules) => {
    const errors = {};
    let isValid = true;

    const validateNested = (current, currentRules, path = '') => {
      Object.keys(currentRules).forEach(key => {
        const fullPath = path ? `${path}.${key}` : key;
        const value = current[key];
        const rule = currentRules[key];

        if (typeof rule === 'function') {
          const error = rule(value);
          if (error) {
            errors[fullPath] = error;
            isValid = false;
          }
        } else if (typeof rule === 'object' && rule !== null) {
          if (value && typeof value === 'object') {
            validateNested(value, rule, fullPath);
          }
        }
      });
    };

    validateNested(obj, rules);
    return { isValid, errors };
  },

  /**
   * Formatea errores para mostrar en la UI
   */
  formatErrors: (errors) => {
    return Object.keys(errors).map(key => ({
      field: key,
      message: errors[key]
    }));
  }
};

export default {
  commonRules,
  useFormValidation,
  FormValidator,
  validationUtils
};
