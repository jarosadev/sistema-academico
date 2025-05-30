// Utilidades generales
export const helpers = {
  // Formatear fecha
  formatDate: (date, format = 'dd/mm/yyyy') => {
    if (!date) return '';
    
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    switch (format) {
      case 'dd/mm/yyyy':
        return `${day}/${month}/${year}`;
      case 'yyyy-mm-dd':
        return `${year}-${month}-${day}`;
      case 'dd-mm-yyyy':
        return `${day}-${month}-${year}`;
      case 'long':
        return d.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      default:
        return `${day}/${month}/${year}`;
    }
  },

  // Formatear fecha y hora
  formatDateTime: (date) => {
    if (!date) return '';
    
    const d = new Date(date);
    return d.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Formatear número con decimales
  formatNumber: (number, decimals = 2) => {
    if (number === null || number === undefined) return '';
    return Number(number).toFixed(decimals);
  },

  // Formatear calificación
  formatGrade: (grade) => {
    if (grade === null || grade === undefined) return '';
    const numGrade = Number(grade);
    return numGrade.toFixed(2);
  },

  // Obtener estado de calificación
  getGradeStatus: (grade) => {
    const numGrade = Number(grade);
    if (numGrade >= 51) return 'aprobado';
    if (numGrade >= 0) return 'reprobado';
    return 'sin_calificar';
  },

  // Obtener color de estado de calificación
  getGradeStatusColor: (grade) => {
    const status = helpers.getGradeStatus(grade);
    switch (status) {
      case 'aprobado':
        return 'text-green-600 bg-green-100';
      case 'reprobado':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  },

  // Capitalizar primera letra
  capitalize: (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  // Capitalizar cada palabra
  capitalizeWords: (str) => {
    if (!str) return '';
    return str.split(' ').map(word => helpers.capitalize(word)).join(' ');
  },

  // Truncar texto
  truncate: (str, length = 50) => {
    if (!str) return '';
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
  },

  // Generar ID único
  generateId: () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  // Debounce function
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle function
  throttle: (func, limit) => {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Obtener iniciales de nombre
  getInitials: (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  },

  // Obtener color aleatorio para avatar
  getAvatarColor: (name) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    
    if (!name) return colors[0];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  },

  // Filtrar array por texto
  filterByText: (array, searchText, fields = []) => {
    if (!searchText) return array;
    
    const search = searchText.toLowerCase();
    
    return array.filter(item => {
      if (fields.length === 0) {
        // Buscar en todas las propiedades string del objeto
        return Object.values(item).some(value => 
          typeof value === 'string' && value.toLowerCase().includes(search)
        );
      } else {
        // Buscar solo en los campos especificados
        return fields.some(field => {
          const value = helpers.getNestedValue(item, field);
          return typeof value === 'string' && value.toLowerCase().includes(search);
        });
      }
    });
  },

  // Obtener valor anidado de objeto
  getNestedValue: (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  },

  // Ordenar array por campo
  sortBy: (array, field, direction = 'asc') => {
    return [...array].sort((a, b) => {
      const aValue = helpers.getNestedValue(a, field);
      const bValue = helpers.getNestedValue(b, field);
      
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  },

  // Agrupar array por campo
  groupBy: (array, field) => {
    return array.reduce((groups, item) => {
      const key = helpers.getNestedValue(item, field);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {});
  },

  // Calcular edad
  calculateAge: (birthDate) => {
    if (!birthDate) return null;
    
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  },

  // Validar si es una fecha válida
  isValidDate: (date) => {
    return date instanceof Date && !isNaN(date);
  },

  // Obtener rango de años
  getYearRange: (startYear, endYear) => {
    const years = [];
    for (let year = startYear; year <= endYear; year++) {
      years.push(year);
    }
    return years;
  },

  // Obtener año académico actual
  getCurrentAcademicYear: () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // Enero = 1
    
    // Si estamos en enero-julio, el año académico es el actual
    // Si estamos en agosto-diciembre, el año académico es el siguiente
    return currentMonth <= 7 ? currentYear : currentYear + 1;
  },

  // Descargar archivo
  downloadFile: (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Copiar texto al portapapeles
  copyToClipboard: async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    }
  },

  // Obtener parámetros de URL
  getUrlParams: () => {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params) {
      result[key] = value;
    }
    return result;
  },

  // Construir query string
  buildQueryString: (params) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });
    return searchParams.toString();
  }
};

// Constantes útiles
export const constants = {
  ROLES: {
    ADMINISTRADOR: 'administrador',
    DOCENTE: 'docente',
    ESTUDIANTE: 'estudiante'
  },
  
  ESTADOS_ACADEMICOS: {
    ACTIVO: 'activo',
    INACTIVO: 'inactivo',
    GRADUADO: 'graduado',
    SUSPENDIDO: 'suspendido'
  },
  
  ESTADOS_INSCRIPCION: {
    INSCRITO: 'inscrito',
    APROBADO: 'aprobado',
    REPROBADO: 'reprobado',
    ABANDONADO: 'abandonado'
  },
  
  TIPOS_EVALUACION: {
    PARCIAL1: 'parcial1',
    PARCIAL2: 'parcial2',
    FINAL: 'final',
    SEGUNDA_INSTANCIA: 'segunda_instancia'
  },
  
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZE_OPTIONS: [10, 25, 50, 100]
  }
};
