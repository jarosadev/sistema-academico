# Sistema Académico - API Completa

## 📋 Descripción

Sistema de gestión académica completo, desarrollado con Node.js, Express y MySQL. Incluye gestión de estudiantes, docentes, materias, inscripciones, notas, reportes y auditoría completa.

## 🚀 Características Principales

### ✅ Módulos Implementados

- **👤 Autenticación y Autorización**
  - Login/logout con JWT
  - Roles: Administrador, Docente, Estudiante
  - Middleware de autenticación y autorización

- **🎯 Gestión de Menciones**
  - CRUD completo de menciones académicas
  - Validaciones y relaciones

- **👨‍🎓 Gestión de Estudiantes**
  - Registro y gestión de estudiantes
  - Historial académico
  - Estados académicos (activo, graduado, suspendido)
  - Importación masiva

- **👨‍🏫 Gestión de Docentes**
  - Registro y gestión de docentes
  - Asignación de materias
  - Carga académica
  - Especialidades

- **📚 Gestión de Materias**
  - CRUD de materias
  - Prerequisitos
  - Organización por semestres
  - Créditos y horas

- **📝 Gestión de Inscripciones**
  - Inscripción de estudiantes a materias
  - Gestión de paralelos
  - Estados de inscripción
  - Inscripción masiva

- **📊 Gestión de Notas**
  - Registro de calificaciones
  - Tipos de evaluación (parciales, final, segunda instancia)
  - Validaciones académicas
  - Registro masivo

- **📈 Sistema de Reportes**
  - Reporte general del sistema
  - Reportes por estudiante
  - Reportes por materia
  - Reportes por docente
  - Reportes por mención
  - Exportación a CSV

- **🔍 Sistema de Auditoría**
  - Registro automático de todas las acciones
  - Logs detallados con información del usuario
  - Estadísticas de uso
  - Limpieza automática de logs antiguos

## 🛠️ Tecnologías Utilizadas

- **Backend**: Node.js, Express.js
- **Base de Datos**: MySQL
- **Autenticación**: JWT (JSON Web Tokens)
- **Seguridad**: Helmet, CORS, Rate Limiting
- **Validación**: Validaciones personalizadas
- **Logging**: Morgan
- **Compresión**: Compression middleware

## 📦 Instalación

### Prerrequisitos

- Node.js (v14 o superior)
- MySQL (v8.0 o superior)
- npm o yarn

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd sistema-academico
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Editar el archivo `.env` con tus configuraciones:
```env
# Base de datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=sistema_academico

# JWT
JWT_SECRET=tu_jwt_secret_muy_seguro
JWT_EXPIRES_IN=24h

# Servidor
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

4. **Crear la base de datos**
```bash
mysql -u root -p
CREATE DATABASE sistema_academico;
```

5. **Ejecutar el esquema de la base de datos**
```bash
mysql -u root -p sistema_academico < sql/schema.sql
```

6. **Instalar el sistema de auditoría**
```bash
node scripts/install-auditoria.js
```

7. **Insertar datos de prueba (opcional)**
```bash
mysql -u root -p sistema_academico < sql/seeds.sql
```

8. **Iniciar el servidor**
```bash
npm start
```

Para desarrollo:
```bash
npm run dev
```

## 🔧 Scripts Disponibles

```bash
# Iniciar servidor en producción
npm start

# Iniciar servidor en desarrollo (con nodemon)
npm run dev

# Ejecutar pruebas completas de la API
node scripts/test-complete-api.js

# Instalar sistema de auditoría
node scripts/install-auditoria.js

# Desinstalar sistema de auditoría
node scripts/install-auditoria.js desinstalar

# Verificar roles de administrador
node scripts/check-admin-roles.js

# Prueba de login
node scripts/test-login.js
```

## 📚 Documentación de la API

### Endpoints Principales

#### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/profile` - Obtener perfil
- `PUT /api/auth/profile` - Actualizar perfil
- `POST /api/auth/change-password` - Cambiar contraseña

#### Menciones
- `GET /api/menciones` - Listar menciones
- `POST /api/menciones` - Crear mención
- `GET /api/menciones/:id` - Obtener mención
- `PUT /api/menciones/:id` - Actualizar mención
- `DELETE /api/menciones/:id` - Eliminar mención

#### Estudiantes
- `GET /api/estudiantes` - Listar estudiantes
- `POST /api/estudiantes` - Crear estudiante
- `GET /api/estudiantes/:id` - Obtener estudiante
- `PUT /api/estudiantes/:id` - Actualizar estudiante
- `DELETE /api/estudiantes/:id` - Eliminar estudiante
- `GET /api/estudiantes/estadisticas` - Estadísticas
- `GET /api/estudiantes/:id/inscripciones` - Inscripciones del estudiante
- `GET /api/estudiantes/:id/notas` - Notas del estudiante

#### Docentes
- `GET /api/docentes` - Listar docentes
- `POST /api/docentes` - Crear docente
- `GET /api/docentes/:id` - Obtener docente
- `PUT /api/docentes/:id` - Actualizar docente
- `DELETE /api/docentes/:id` - Eliminar docente
- `GET /api/docentes/:id/materias` - Materias del docente
- `POST /api/docentes/:id/materias` - Asignar materia
- `GET /api/docentes/:id/carga-academica` - Carga académica

#### Materias
- `GET /api/materias` - Listar materias
- `POST /api/materias` - Crear materia
- `GET /api/materias/:id` - Obtener materia
- `PUT /api/materias/:id` - Actualizar materia
- `DELETE /api/materias/:id` - Eliminar materia
- `GET /api/materias/mencion/:id` - Materias por mención

#### Inscripciones
- `GET /api/inscripciones` - Listar inscripciones
- `POST /api/inscripciones` - Crear inscripción
- `GET /api/inscripciones/:id` - Obtener inscripción
- `PUT /api/inscripciones/:id` - Actualizar inscripción
- `DELETE /api/inscripciones/:id` - Eliminar inscripción
- `POST /api/inscripciones/masiva` - Inscripción masiva

#### Notas
- `GET /api/notas` - Listar notas
- `POST /api/notas` - Registrar nota
- `GET /api/notas/:id` - Obtener nota
- `PUT /api/notas/:id` - Actualizar nota
- `DELETE /api/notas/:id` - Eliminar nota
- `POST /api/notas/masivo` - Registro masivo

#### Reportes
- `GET /api/reportes/general` - Reporte general
- `GET /api/reportes/estudiante/:id` - Reporte de estudiante
- `GET /api/reportes/materia/:id` - Reporte de materia
- `GET /api/reportes/docente/:id` - Reporte de docente
- `GET /api/reportes/mencion/:id` - Reporte de mención
- `GET /api/reportes/exportar/csv` - Exportar a CSV

#### Auditoría
- `GET /api/auditoria/logs` - Logs de auditoría
- `GET /api/auditoria/estadisticas` - Estadísticas de auditoría
- `DELETE /api/auditoria/limpiar` - Limpiar logs antiguos

### Autenticación

Todas las rutas protegidas requieren un token JWT en el header:
```
Authorization: Bearer <token>
```

### Roles y Permisos

- **Administrador**: Acceso completo a todos los endpoints
- **Docente**: Acceso a sus materias, estudiantes y notas
- **Estudiante**: Acceso a su información personal y notas

## 🔒 Seguridad

- **JWT**: Tokens seguros con expiración
- **Helmet**: Headers de seguridad HTTP
- **CORS**: Configuración de origen cruzado
- **Rate Limiting**: Límite de requests por IP
- **Validación**: Validación de datos de entrada
- **Auditoría**: Registro de todas las acciones

## 📊 Base de Datos

### Tablas Principales

- `usuarios` - Usuarios del sistema
- `menciones` - Menciones académicas
- `estudiantes` - Información de estudiantes
- `docentes` - Información de docentes
- `materias` - Materias del plan de estudios
- `inscripciones` - Inscripciones de estudiantes
- `notas` - Calificaciones
- `docente_materias` - Asignación docente-materia
- `auditoria` - Logs de auditoría

### Relaciones

- Un estudiante pertenece a una mención
- Un docente puede tener múltiples materias
- Una materia pertenece a una mención
- Las inscripciones relacionan estudiantes con materias
- Las notas están asociadas a inscripciones

## 🧪 Pruebas

### Ejecutar Pruebas Completas

```bash
# Asegúrate de que el servidor esté ejecutándose
npm start

# En otra terminal, ejecuta las pruebas
node scripts/test-complete-api.js
```

### Pruebas Individuales

```bash
# Probar autenticación
node scripts/test-login.js

# Verificar roles
node scripts/check-admin-roles.js
```

## 📈 Monitoreo y Logs

### Endpoints de Salud

- `GET /health` - Estado del servidor
- `GET /api/stats` - Estadísticas de la API

### Logs de Auditoría

El sistema registra automáticamente:
- Inicios de sesión
- Cambios en datos críticos
- Acceso a información sensible
- Exportaciones de datos

## 🚀 Despliegue

### Variables de Entorno para Producción

```env
NODE_ENV=production
DB_HOST=tu_host_produccion
DB_USER=tu_usuario_produccion
DB_PASSWORD=tu_password_seguro
JWT_SECRET=tu_jwt_secret_muy_muy_seguro
CORS_ORIGIN=https://tu-frontend.com
```

### Consideraciones de Producción

1. **Base de Datos**: Usar conexiones SSL
2. **Logs**: Configurar rotación de logs
3. **Monitoreo**: Implementar health checks
4. **Backup**: Configurar respaldos automáticos
5. **SSL**: Usar HTTPS en producción

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👥 Autores

- **Equipo de Desarrollo** - *Desarrollo inicial*

## 🙏 Agradecimientos

- Universidad Mayor de San Andrés
- Facultad de Ingeniería
- Carrera de Ingeniería de Sistemas

## 📞 Soporte

Para soporte técnico o consultas:
- Email: soporte@academia.edu.bo
- Documentación: [Wiki del proyecto]
- Issues: [GitHub Issues]

---

**Sistema Académico v1.0.0** - Desarrollado con ❤️ para la educación superior
