# Sistema Académico - Backend

Sistema de gestión académica universitaria desarrollado con Express.js y MySQL.

## 🚀 Características Principales

- **Autenticación JWT**: Sistema seguro de login con roles y permisos
- **Control de Acceso**: Roles de administrador, docente y estudiante
- **Gestión Académica**: Estudiantes, docentes, materias, inscripciones y notas
- **Sistema de Auditoría**: Registro completo de todas las acciones
- **Reportes**: Generación de reportes en PDF y Excel
- **API RESTful**: Endpoints bien documentados y estructurados

## 🛠️ Tecnologías Utilizadas

- **Backend**: Node.js + Express.js
- **Base de Datos**: MySQL 8.0+
- **Autenticación**: JWT (JSON Web Tokens)
- **Validación**: Joi
- **Seguridad**: Helmet, CORS, Rate Limiting
- **Reportes**: PDFKit, ExcelJS

## 📋 Requisitos Previos

- Node.js 16.0+
- MySQL 8.0+
- npm o yarn

## ⚙️ Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd sonet-academic-backend
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:
```env
# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=123456
DB_NAME=sonet_academic

# JWT
JWT_SECRET=tu_clave_secreta_aqui
JWT_EXPIRES_IN=24h

# Servidor
PORT=3000
NODE_ENV=development
```

4. **Crear base de datos y tablas**
```bash
npm run migrate
```

5. **Poblar datos iniciales**
```bash
node sql/seeds.js
```

6. **Iniciar servidor**
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 🏗️ Estructura del Proyecto

```
/
├── config/                 # Configuraciones
│   ├── database.js        # Conexión MySQL
│   ├── auth.js           # Configuración JWT
│   └── constants.js      # Constantes del sistema
├── controllers/           # Controladores de negocio
│   ├── authController.js
│   ├── mencionController.js
│   └── ...
├── middleware/           # Middlewares
│   ├── auth.js          # Autenticación y autorización
│   ├── validation.js    # Validación de datos
│   ├── errorHandler.js  # Manejo de errores
│   └── audit.js         # Auditoría
├── models/              # Modelos de datos
├── routes/              # Rutas de la API
├── services/            # Servicios de negocio
├── utils/               # Utilidades
├── sql/                 # Scripts SQL
│   ├── schema.sql       # Esquema de base de datos
│   └── seeds.sql        # Datos iniciales
└── scripts/             # Scripts de utilidad
```

## 🔐 Sistema de Autenticación

### Roles del Sistema

1. **Administrador**: Acceso completo al sistema
2. **Docente**: Gestión de materias y notas
3. **Estudiante**: Consulta de información académica

### Endpoints de Autenticación

```http
POST /api/auth/register    # Registro de usuario
POST /api/auth/login       # Inicio de sesión
GET  /api/auth/verify      # Verificar token
POST /api/auth/logout      # Cerrar sesión
```

### Usuario Administrador por Defecto

```
Email: admin@umsa.edu.bo
Password: Admin123!
```

## 📚 API Endpoints

### Menciones Académicas
```http
GET    /api/menciones           # Listar menciones
POST   /api/menciones           # Crear mención (Admin)
GET    /api/menciones/:id       # Obtener mención
PUT    /api/menciones/:id       # Actualizar mención (Admin)
DELETE /api/menciones/:id       # Eliminar mención (Admin)
GET    /api/menciones/:id/stats # Estadísticas de mención
```

### Estudiantes
```http
GET    /api/estudiantes         # Listar estudiantes
POST   /api/estudiantes         # Crear estudiante (Admin)
GET    /api/estudiantes/:id     # Obtener estudiante
PUT    /api/estudiantes/:id     # Actualizar estudiante
DELETE /api/estudiantes/:id     # Eliminar estudiante (Admin)
```

### Docentes
```http
GET    /api/docentes           # Listar docentes
POST   /api/docentes           # Crear docente (Admin)
GET    /api/docentes/:id       # Obtener docente
PUT    /api/docentes/:id       # Actualizar docente
DELETE /api/docentes/:id       # Eliminar docente (Admin)
```

### Materias
```http
GET    /api/materias           # Listar materias
POST   /api/materias           # Crear materia (Admin/Docente)
GET    /api/materias/:id       # Obtener materia
PUT    /api/materias/:id       # Actualizar materia (Admin/Docente)
DELETE /api/materias/:id       # Eliminar materia (Admin)
```

### Inscripciones
```http
GET    /api/inscripciones      # Listar inscripciones
POST   /api/inscripciones      # Crear inscripción
GET    /api/inscripciones/:id  # Obtener inscripción
PUT    /api/inscripciones/:id  # Actualizar inscripción
DELETE /api/inscripciones/:id  # Cancelar inscripción
```

### Notas
```http
GET    /api/notas              # Listar notas
POST   /api/notas              # Registrar nota (Docente)
GET    /api/notas/:id          # Obtener nota
PUT    /api/notas/:id          # Actualizar nota (Docente)
DELETE /api/notas/:id          # Eliminar nota (Admin)
```

### Reportes
```http
GET    /api/reportes/estudiantes     # Reporte de estudiantes
GET    /api/reportes/materias        # Reporte de materias
GET    /api/reportes/notas           # Reporte de notas
GET    /api/reportes/inscripciones   # Reporte de inscripciones
```

## 🗄️ Base de Datos

### Entidades Principales

- **usuarios**: Usuarios del sistema
- **roles**: Roles y permisos
- **estudiantes**: Información de estudiantes
- **docentes**: Información de docentes
- **menciones**: Carreras académicas
- **materias**: Materias por mención
- **inscripciones**: Inscripciones de estudiantes
- **notas**: Calificaciones
- **historial_academico**: Historial por estudiante
- **auditoria**: Registro de actividades

## 🧪 Testing

### Scripts de Prueba Disponibles

```bash
# Probar autenticación
node scripts/test-login.js

# Verificar roles de admin
node scripts/check-admin-roles.js

# Prueba completa del sistema
node test-comprehensive.js
```

### Ejemplo de Uso con cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"admin@umsa.edu.bo","password":"Admin123!"}'

# Listar menciones (con token)
curl -X GET http://localhost:3000/api/menciones \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Crear mención
curl -X POST http://localhost:3000/api/menciones \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Nueva Mención","descripcion":"Descripción","materias_requeridas":40}'
```

## 🔧 Scripts Disponibles

```bash
npm start          # Iniciar servidor en producción
npm run dev        # Iniciar servidor en desarrollo
npm run migrate    # Ejecutar migraciones
npm test           # Ejecutar tests
```

## 🛡️ Seguridad

- **JWT Tokens**: Autenticación segura con expiración
- **Rate Limiting**: Límite de peticiones por IP
- **Helmet**: Headers de seguridad HTTP
- **CORS**: Control de acceso entre dominios
- **Validación**: Validación estricta de datos de entrada
- **Auditoría**: Registro de todas las acciones

## 📊 Monitoreo y Logs

- **Morgan**: Logging de peticiones HTTP
- **Winston**: Sistema de logs estructurado
- **Auditoría**: Registro completo de cambios en BD

## 🚀 Despliegue

### Variables de Entorno para Producción

```env
NODE_ENV=production
PORT=3000
DB_HOST=tu_host_mysql
DB_USER=tu_usuario
DB_PASSWORD=tu_password_segura
JWT_SECRET=clave_jwt_muy_segura_y_larga
```

### Docker (Opcional)

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👥 Equipo de Desarrollo

- **Development Team**
- **Sistema Académico **



---

**Sistema Académico ** - Digitalizando la educación universitaria 🎓
