// Constantes del sistema académico 

// Estados académicos de estudiantes
const ESTADOS_ESTUDIANTE = {
    ACTIVO: 'activo',
    INACTIVO: 'inactivo',
    GRADUADO: 'graduado',
    SUSPENDIDO: 'suspendido'
};

// Estados de inscripciones
const ESTADOS_INSCRIPCION = {
    INSCRITO: 'inscrito',
    APROBADO: 'aprobado',
    REPROBADO: 'reprobado',
    ABANDONADO: 'abandonado'
};

// Tipos de evaluación
const TIPOS_EVALUACION = {
    PARCIAL1: 'parcial1',
    PARCIAL2: 'parcial2',
    FINAL: 'final',
    SEGUNDA_INSTANCIA: 'segunda_instancia'
};

// Acciones de auditoría
const ACCIONES_AUDITORIA = {
    INSERT: 'INSERT',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE'
};

// Tablas del sistema para auditoría
const TABLAS_SISTEMA = {
    USUARIOS: 'usuarios',
    ROLES: 'roles',
    ESTUDIANTES: 'estudiantes',
    DOCENTES: 'docentes',
    MENCIONES: 'menciones',
    MATERIAS: 'materias',
    INSCRIPCIONES: 'inscripciones',
    NOTAS: 'notas',
    HISTORIAL_ACADEMICO: 'historial_academico'
};

// Rangos de calificaciones
const CALIFICACIONES = {
    MINIMA: 0,
    MAXIMA: 100,
    APROBACION: 51
};

// Semestres académicos
const SEMESTRES = {
    PRIMERO: 1,
    SEGUNDO: 2,
    TERCERO: 3,
    CUARTO: 4,
    QUINTO: 5,
    SEXTO: 6,
    SEPTIMO: 7,
    OCTAVO: 8,
    NOVENO: 9,
    DECIMO: 10
};

// Paralelos disponibles
const PARALELOS = ['A', 'B', 'C', 'D', 'E'];

// Mensajes de error comunes
const MENSAJES_ERROR = {
    // Autenticación
    CREDENCIALES_INVALIDAS: 'Credenciales inválidas',
    TOKEN_EXPIRADO: 'Token de sesión expirado',
    TOKEN_INVALIDO: 'Token de sesión inválido',
    ACCESO_DENEGADO: 'Acceso denegado',
    USUARIO_BLOQUEADO: 'Usuario bloqueado por múltiples intentos fallidos',
    
    // Validación
    DATOS_REQUERIDOS: 'Datos requeridos faltantes',
    FORMATO_INVALIDO: 'Formato de datos inválido',
    EMAIL_INVALIDO: 'Formato de correo electrónico inválido',
    PASSWORD_DEBIL: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número',
    
    // Base de datos
    REGISTRO_NO_ENCONTRADO: 'Registro no encontrado',
    REGISTRO_DUPLICADO: 'Ya existe un registro con estos datos',
    ERROR_BASE_DATOS: 'Error en la base de datos',
    
    // Negocio
    ESTUDIANTE_YA_INSCRITO: 'El estudiante ya está inscrito en esta materia',
    CALIFICACION_INVALIDA: 'La calificación debe estar entre 0 y 100',
    SEMESTRE_INVALIDO: 'Semestre inválido',
    PARALELO_INVALIDO: 'Paralelo inválido',
    
    // Sistema
    ERROR_INTERNO: 'Error interno del servidor',
    SERVICIO_NO_DISPONIBLE: 'Servicio no disponible temporalmente'
};

// Mensajes de éxito
const MENSAJES_EXITO = {
    REGISTRO_CREADO: 'Registro creado exitosamente',
    REGISTRO_ACTUALIZADO: 'Registro actualizado exitosamente',
    REGISTRO_ELIMINADO: 'Registro eliminado exitosamente',
    LOGIN_EXITOSO: 'Inicio de sesión exitoso',
    LOGOUT_EXITOSO: 'Cierre de sesión exitoso',
    PASSWORD_ACTUALIZADO: 'Contraseña actualizada exitosamente',
    INSCRIPCION_EXITOSA: 'Inscripción realizada exitosamente',
    NOTA_REGISTRADA: 'Nota registrada exitosamente'
};

// Códigos de estado HTTP
const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
};

// Configuración de paginación
const PAGINACION = {
    LIMITE_DEFAULT: 10,
    LIMITE_MAXIMO: 100,
    PAGINA_DEFAULT: 1
};

// Configuración de reportes
const REPORTES = {
    FORMATOS: {
        PDF: 'pdf',
        EXCEL: 'excel'
    },
    TIPOS: {
        ESTUDIANTES: 'estudiantes',
        DOCENTES: 'docentes',
        MATERIAS: 'materias',
        INSCRIPCIONES: 'inscripciones',
        NOTAS: 'notas',
        HISTORIAL: 'historial',
        AUDITORIA: 'auditoria'
    }
};

// Configuración de archivos
const ARCHIVOS = {
    TAMAÑO_MAXIMO: 5 * 1024 * 1024, // 5MB
    TIPOS_PERMITIDOS: ['image/jpeg', 'image/png', 'application/pdf'],
    DIRECTORIO_UPLOADS: 'uploads/'
};

// Expresiones regulares útiles
const REGEX = {
    CI: /^\d{7,8}$/,
    TELEFONO: /^[67]\d{7}$/,
    SIGLA_MATERIA: /^[A-Z]{3}\d{3}$/,
    SOLO_LETRAS: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
    SOLO_NUMEROS: /^\d+$/,
    ALFANUMERICO: /^[a-zA-Z0-9\s]+$/
};

// Configuración de logs
const LOG_LEVELS = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug'
};

// Configuración de cache
const CACHE = {
    TTL_DEFAULT: 300, // 5 minutos
    TTL_LARGO: 3600,  // 1 hora
    TTL_CORTO: 60     // 1 minuto
};

module.exports = {
    ESTADOS_ESTUDIANTE,
    ESTADOS_INSCRIPCION,
    TIPOS_EVALUACION,
    ACCIONES_AUDITORIA,
    TABLAS_SISTEMA,
    CALIFICACIONES,
    SEMESTRES,
    PARALELOS,
    MENSAJES_ERROR,
    MENSAJES_EXITO,
    HTTP_STATUS,
    PAGINACION,
    REPORTES,
    ARCHIVOS,
    REGEX,
    LOG_LEVELS,
    CACHE
};
