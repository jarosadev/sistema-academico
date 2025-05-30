import { dataService } from './dataService';

/**
 * Servicio específico para la gestión de docentes
 * Extiende las funcionalidades básicas del dataService con lógica específica
 */
export const docenteService = {
  /**
   * Obtener todos los docentes con filtros y paginación
   */
  async obtenerDocentes(filtros = {}) {
    try {
      const parametros = {
        page: filtros.pagina || 1,
        limit: filtros.limite || 10,
        search: filtros.busqueda || '',
        especialidad: filtros.especialidad || '',
        activo: filtros.activo !== undefined ? filtros.activo : '',
        sort: filtros.ordenamiento || 'nombre',
        order: filtros.direccion || 'asc'
      };

      // Limpiar parámetros vacíos
      Object.keys(parametros).forEach(key => {
        if (parametros[key] === '' || parametros[key] === null || parametros[key] === undefined) {
          delete parametros[key];
        }
      });

      const response = await dataService.docentes.obtenerTodos(parametros);
      
      return {
        docentes: response.data.data || response.data || [],
        total: response.data.total || 0,
        totalPaginas: response.data.totalPages || Math.ceil((response.data.total || 0) / (parametros.limit || 10)),
        paginaActual: response.data.currentPage || parametros.page || 1,
        limite: response.data.limit || parametros.limit || 10
      };
    } catch (error) {
      console.error('Error al obtener docentes:', error);
      throw new Error(error.response?.data?.message || 'Error al cargar los docentes');
    }
  },

  /**
   * Obtener un docente por ID con información completa
   */
  async obtenerDocentePorId(id) {
    try {
      const response = await dataService.docentes.obtenerPorId(id);
      return response.data;
    } catch (error) {
      console.error('Error al obtener docente:', error);
      throw new Error(error.response?.data?.message || 'Error al cargar el docente');
    }
  },

  /**
   * Crear un nuevo docente
   */
  async crearDocente(datosDocente) {
    try {
      // Validar datos requeridos
      this.validarDatosDocente(datosDocente);

      // Formatear datos
      const datosFormateados = this.formatearDatosDocente(datosDocente);

      const response = await dataService.docentes.crear(datosFormateados);
      return response.data;
    } catch (error) {
      console.error('Error al crear docente:', error);
      throw new Error(error.response?.data?.message || 'Error al crear el docente');
    }
  },

  /**
   * Actualizar un docente existente
   */
  async actualizarDocente(id, datosDocente) {
    try {
      // Validar datos requeridos (menos estricto para actualización)
      this.validarDatosDocente(datosDocente, false);

      // Formatear datos
      const datosFormateados = this.formatearDatosDocente(datosDocente, false);

      const response = await dataService.docentes.actualizar(id, datosFormateados);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar docente:', error);
      throw new Error(error.response?.data?.message || 'Error al actualizar el docente');
    }
  },

  /**
   * Eliminar un docente
   */
  async eliminarDocente(id) {
    try {
      await dataService.docentes.eliminar(id);
      return true;
    } catch (error) {
      console.error('Error al eliminar docente:', error);
      throw new Error(error.response?.data?.message || 'Error al eliminar el docente');
    }
  },

  /**
   * Obtener estadísticas de docentes
   */
  async obtenerEstadisticas() {
    try {
      const response = await dataService.docentes.obtenerEstadisticas();
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return {
        total: 0,
        activos: 0,
        inactivos: 0,
        porEspecialidad: [],
        nuevosEsteMes: 0
      };
    }
  },

  /**
   * Obtener materias de un docente
   */
  async obtenerMateriasDocente(idDocente) {
    try {
      const response = await dataService.docentes.obtenerMaterias(idDocente);
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener materias del docente:', error);
      return [];
    }
  },

  /**
   * Obtener estudiantes de un docente
   */
  async obtenerEstudiantesDocente(idDocente) {
    try {
      const response = await dataService.docentes.obtenerEstudiantes(idDocente);
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener estudiantes del docente:', error);
      return [];
    }
  },

  /**
   * Obtener carga académica de un docente
   */
  async obtenerCargaAcademica(idDocente) {
    try {
      const response = await dataService.docentes.obtenerCargaAcademica(idDocente);
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener carga académica:', error);
      return [];
    }
  },

  /**
   * Asignar materia a un docente
   */
  async asignarMateria(idDocente, idMateria, datosAdicionales = {}) {
    try {
      const datos = {
        id_materia: idMateria,
        ...datosAdicionales
      };

      const response = await dataService.docentes.asignarMateria(idDocente, datos);
      return response.data;
    } catch (error) {
      console.error('Error al asignar materia:', error);
      throw new Error(error.response?.data?.message || 'Error al asignar la materia');
    }
  },

  /**
   * Desasignar materia de un docente
   */
  async desasignarMateria(idDocente, idMateria) {
    try {
      await dataService.docentes.desasignarMateria(idDocente, idMateria);
      return true;
    } catch (error) {
      console.error('Error al desasignar materia:', error);
      throw new Error(error.response?.data?.message || 'Error al desasignar la materia');
    }
  },

  /**
   * Obtener especialidades disponibles
   */
  async obtenerEspecialidades() {
    try {
      // Si hay un endpoint específico para especialidades, usarlo
      // Por ahora, devolvemos una lista predefinida
      return [
        'Ingeniería de Sistemas',
        'Ingeniería Industrial',
        'Ingeniería Civil',
        'Ingeniería Electrónica',
        'Ingeniería Mecánica',
        'Matemáticas',
        'Física',
        'Química',
        'Estadística',
        'Economía',
        'Administración',
        'Contabilidad',
        'Derecho',
        'Psicología',
        'Sociología',
        'Historia',
        'Filosofía',
        'Literatura',
        'Idiomas'
      ];
    } catch (error) {
      console.error('Error al obtener especialidades:', error);
      return [];
    }
  },

  /**
   * Buscar docentes por especialidad
   */
  async buscarPorEspecialidad(especialidad) {
    try {
      const response = await dataService.docentes.obtenerPorEspecialidad(especialidad);
      return response.data || [];
    } catch (error) {
      console.error('Error al buscar por especialidad:', error);
      return [];
    }
  },

  /**
   * Validar datos del docente
   */
  validarDatosDocente(datos, esCreacion = true) {
    const errores = [];

    // Validaciones para creación
    if (esCreacion) {
      if (!datos.nombre?.trim()) errores.push('El nombre es requerido');
      if (!datos.apellido?.trim()) errores.push('El apellido es requerido');
      if (!datos.ci?.trim()) errores.push('El CI es requerido');
      if (!datos.correo?.trim()) errores.push('El correo es requerido');
      if (!datos.password?.trim()) errores.push('La contraseña es requerida');
    }

    // Validaciones comunes
    if (datos.correo && !this.validarEmail(datos.correo)) {
      errores.push('El formato del correo no es válido');
    }

    if (datos.ci && !this.validarCI(datos.ci)) {
      errores.push('El formato del CI no es válido');
    }

    if (datos.telefono && !this.validarTelefono(datos.telefono)) {
      errores.push('El formato del teléfono no es válido');
    }

    if (errores.length > 0) {
      throw new Error(errores.join(', '));
    }
  },

  /**
   * Formatear datos del docente para envío
   */
  formatearDatosDocente(datos, esCreacion = true) {
    const datosFormateados = {
      nombre: datos.nombre?.trim(),
      apellido: datos.apellido?.trim(),
      especialidad: datos.especialidad?.trim(),
      telefono: datos.telefono?.trim(),
      activo: datos.activo !== undefined ? datos.activo : true
    };

    // Solo incluir en creación o si se proporciona
    if (esCreacion || datos.ci) {
      datosFormateados.ci = datos.ci?.trim();
    }

    if (esCreacion || datos.correo) {
      datosFormateados.correo = datos.correo?.trim().toLowerCase();
    }

    if (datos.password?.trim()) {
      datosFormateados.password = datos.password;
    }

    if (datos.fecha_contratacion) {
      datosFormateados.fecha_contratacion = datos.fecha_contratacion;
    }

    return datosFormateados;
  },

  /**
   * Validar formato de email
   */
  validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  /**
   * Validar formato de CI
   */
  validarCI(ci) {
    const regex = /^[0-9]{7,10}$/;
    return regex.test(ci);
  },

  /**
   * Validar formato de teléfono
   */
  validarTelefono(telefono) {
    const regex = /^[0-9+\-\s()]{7,15}$/;
    return regex.test(telefono);
  },

  /**
   * Formatear nombre completo
   */
  formatearNombreCompleto(docente) {
    return `${docente.nombre} ${docente.apellido}`.trim();
  },

  /**
   * Obtener iniciales del docente
   */
  obtenerIniciales(docente) {
    const nombre = docente.nombre?.charAt(0)?.toUpperCase() || '';
    const apellido = docente.apellido?.charAt(0)?.toUpperCase() || '';
    return `${nombre}${apellido}`;
  },

  /**
   * Calcular años de servicio
   */
  calcularAnosServicio(fechaContratacion) {
    if (!fechaContratacion) return 0;
    const fecha = new Date(fechaContratacion);
    const hoy = new Date();
    const diferencia = hoy.getTime() - fecha.getTime();
    return Math.floor(diferencia / (1000 * 60 * 60 * 24 * 365.25));
  },

  /**
   * Exportar docentes (preparar datos para exportación)
   */
  async exportarDocentes(filtros = {}) {
    try {
      const { docentes } = await this.obtenerDocentes({ ...filtros, limite: 1000 });
      
      return docentes.map(docente => ({
        'Nombre': docente.nombre,
        'Apellido': docente.apellido,
        'CI': docente.ci,
        'Correo': docente.correo,
        'Teléfono': docente.telefono || '',
        'Especialidad': docente.especialidad,
        'Fecha Contratación': docente.fecha_contratacion ? 
          new Date(docente.fecha_contratacion).toLocaleDateString('es-ES') : '',
        'Estado': docente.activo ? 'Activo' : 'Inactivo',
        'Años de Servicio': this.calcularAnosServicio(docente.fecha_contratacion)
      }));
    } catch (error) {
      console.error('Error al exportar docentes:', error);
      throw new Error('Error al preparar los datos para exportación');
    }
  }
};

export default docenteService;
