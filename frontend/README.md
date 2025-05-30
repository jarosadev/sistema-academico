# Sistema Académico  - Frontend

Frontend desarrollado en React con Vite para el Sistema de Gestión Académica.

## 🚀 Tecnologías Utilizadas

- **React 18** - Librería de interfaz de usuario
- **Vite** - Herramienta de construcción y desarrollo
- **React Router DOM** - Enrutamiento del lado del cliente
- **Axios** - Cliente HTTP para comunicación con la API
- **Tailwind CSS** - Framework de CSS utilitario
- **Lucide React** - Iconos modernos
- **PostCSS** - Procesamiento de CSS

## 📁 Estructura del Proyecto

```
frontend/
├── public/                 # Archivos estáticos
├── src/
│   ├── components/        # Componentes reutilizables
│   │   ├── auth/         # Componentes de autenticación
│   │   ├── layout/       # Componentes de diseño
│   │   ├── routing/      # Componentes de enrutamiento
│   │   └── ui/           # Componentes de interfaz base
│   ├── contexts/         # Contextos de React
│   ├── pages/            # Páginas principales
│   ├── services/         # Servicios de API
│   ├── utils/            # Utilidades y helpers
│   ├── App.jsx           # Componente principal
│   ├── main.jsx          # Punto de entrada
│   └── index.css         # Estilos globales
├── package.json          # Dependencias y scripts
├── vite.config.js        # Configuración de Vite
├── tailwind.config.js    # Configuración de Tailwind
└── postcss.config.js     # Configuración de PostCSS
```

## 🎨 Sistema de Diseño

### Colores
- **Primario**: Azul  (#1e40af, #3b82f6)
- **Secundario**: Grises (#374151, #6b7280, #9ca3af)
- **Estados**: Verde (éxito), Rojo (error), Amarillo (advertencia)

### Componentes UI
- **Button**: Botones con variantes y estados
- **Input**: Campos de entrada con validación
- **Card**: Contenedores de contenido
- **Alert**: Mensajes de estado
- **Modal**: Ventanas modales
- **Table**: Tablas con funcionalidades avanzadas
- **Loading**: Indicadores de carga

## 🔐 Sistema de Autenticación

### Roles de Usuario
- **Administrador**: Acceso completo al sistema
- **Docente**: Gestión de materias y estudiantes
- **Estudiante**: Consulta de notas e inscripciones

### Rutas Protegidas
- Autenticación requerida para rutas principales
- Control de acceso basado en roles
- Redirección automática según permisos

## 📱 Funcionalidades Principales

### Para Administradores
- Dashboard con estadísticas generales
- Gestión de estudiantes, docentes y materias
- Administración de inscripciones y notas
- Generación de reportes
- Auditoría del sistema

### Para Docentes
- Dashboard personalizado
- Gestión de materias asignadas
- Calificación de estudiantes
- Consulta de horarios
- Reportes académicos

### Para Estudiantes
- Dashboard con información académica
- Consulta de notas y calificaciones
- Gestión de inscripciones
- Visualización de horarios
- Historial académico

## 🛠️ Instalación y Configuración

### Prerrequisitos
- Node.js 16+ 
- npm o yarn

### Instalación
```bash
# Clonar el repositorio
git clone [url-del-repositorio]

# Navegar al directorio frontend
cd frontend

# Instalar dependencias
npm install

# Instalar dependencias adicionales
npm install react-router-dom axios lucide-react
```

### Variables de Entorno
Crear archivo `.env` en la raíz del proyecto:
```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=Sistema Académico
```

### Desarrollo
```bash
# Iniciar servidor de desarrollo
npm run dev

# El servidor estará disponible en http://localhost:3000
```

### Construcción para Producción
```bash
# Construir para producción
npm run build

# Previsualizar construcción
npm run preview
```

## 🔧 Configuración de la API

El frontend está configurado para comunicarse con la API backend en `http://localhost:8000`. 

### Proxy de Desarrollo
Vite está configurado para hacer proxy de las peticiones `/api` al backend:

```javascript
// vite.config.js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
      secure: false,
    }
  }
}
```

## 📋 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo

# Construcción
npm run build        # Construir para producción
npm run preview      # Previsualizar construcción

# Linting y formato
npm run lint         # Verificar código con ESLint
```

## 🎯 Características Técnicas

### Gestión de Estado
- Context API para autenticación
- Estado local para componentes
- Persistencia en localStorage

### Validación de Formularios
- Validación en tiempo real
- Mensajes de error personalizados
- Reglas de validación reutilizables

### Manejo de Errores
- Interceptores de Axios
- Manejo centralizado de errores
- Mensajes de error amigables

### Responsive Design
- Diseño móvil primero
- Breakpoints de Tailwind CSS
- Componentes adaptativos

## 🔒 Seguridad

- Tokens JWT para autenticación
- Rutas protegidas por roles
- Validación del lado del cliente
- Sanitización de datos

## 📈 Rendimiento

- Lazy loading de componentes
- Optimización de imágenes
- Minificación de código
- Tree shaking automático

## 🐛 Debugging

### Herramientas de Desarrollo
- React Developer Tools
- Redux DevTools (si se usa)
- Vite HMR para desarrollo rápido

### Logging
- Console.log para desarrollo
- Error boundaries para producción
- Reportes de errores centralizados

## 🚀 Despliegue

### Construcción
```bash
npm run build
```

### Archivos Generados
- `dist/` - Archivos optimizados para producción
- Archivos estáticos listos para servir

### Configuración del Servidor
- Configurar proxy reverso para `/api`
- Servir archivos estáticos desde `dist/`
- Configurar fallback para SPA routing

## 📞 Soporte

Para reportar problemas o solicitar funcionalidades:
1. Crear issue en el repositorio
2. Incluir pasos para reproducir
3. Especificar navegador y versión

## 📄 Licencia

Este proyecto es parte del Sistema Académico.
