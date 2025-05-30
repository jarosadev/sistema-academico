import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/routing/ProtectedRoute';
import RoleBasedRoute from './components/routing/RoleBasedRoute';
import Layout from './components/layout/Layout';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import NotFoundPage from './pages/NotFoundPage';

// Admin Pages
import EstudiantesPage from './pages/admin/EstudiantesPage';
import DocentesPage from './pages/admin/DocentesPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Rutas públicas */}
            <Route 
              path="/login" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <LoginPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <RegisterPage />
                </ProtectedRoute>
              } 
            />

            {/* Rutas protegidas con layout */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* Dashboard - accesible para todos los roles autenticados */}
              <Route path="dashboard" element={
                <DashboardPage />
              } />
              
              {/* Perfil - accesible para todos los roles autenticados */}
              <Route path="profile" element={<ProfilePage />} />

              {/* Rutas específicas para Administrador */}
              <Route 
                path="estudiantes" 
                element={
                  <RoleBasedRoute allowedRoles={['administrador']} showUnauthorized>
                    <EstudiantesPage />
                  </RoleBasedRoute>
                } 
              />
              <Route 
                path="docentes" 
                element={
                  <RoleBasedRoute allowedRoles={['administrador']} showUnauthorized>
                    <DocentesPage />
                  </RoleBasedRoute>
                } 
              />
              <Route 
                path="materias" 
                element={
                  <RoleBasedRoute allowedRoles={['administrador']} showUnauthorized>
                    <div>Gestión de Materias (En desarrollo)</div>
                  </RoleBasedRoute>
                } 
              />
              <Route 
                path="menciones" 
                element={
                  <RoleBasedRoute allowedRoles={['administrador']} showUnauthorized>
                    <div>Gestión de Menciones (En desarrollo)</div>
                  </RoleBasedRoute>
                } 
              />
              <Route 
                path="inscripciones" 
                element={
                  <RoleBasedRoute allowedRoles={['administrador']} showUnauthorized>
                    <div>Gestión de Inscripciones (En desarrollo)</div>
                  </RoleBasedRoute>
                } 
              />
              <Route 
                path="notas" 
                element={
                  <RoleBasedRoute allowedRoles={['administrador']} showUnauthorized>
                    <div>Gestión de Notas (En desarrollo)</div>
                  </RoleBasedRoute>
                } 
              />
              <Route 
                path="reportes" 
                element={
                  <RoleBasedRoute allowedRoles={['administrador']} showUnauthorized>
                    <div>Reportes del Sistema (En desarrollo)</div>
                  </RoleBasedRoute>
                } 
              />
              <Route 
                path="auditoria" 
                element={
                  <RoleBasedRoute allowedRoles={['administrador']} showUnauthorized>
                    <div>Auditoría del Sistema (En desarrollo)</div>
                  </RoleBasedRoute>
                } 
              />

              {/* Rutas específicas para Docente */}
              <Route 
                path="mis-materias" 
                element={
                  <RoleBasedRoute allowedRoles={['docente', 'estudiante']} showUnauthorized>
                    <div>Mis Materias (En desarrollo)</div>
                  </RoleBasedRoute>
                } 
              />
              <Route 
                path="mis-estudiantes" 
                element={
                  <RoleBasedRoute allowedRoles={['docente']} showUnauthorized>
                    <div>Mis Estudiantes (En desarrollo)</div>
                  </RoleBasedRoute>
                } 
              />
              <Route 
                path="calificaciones" 
                element={
                  <RoleBasedRoute allowedRoles={['docente']} showUnauthorized>
                    <div>Gestión de Calificaciones (En desarrollo)</div>
                  </RoleBasedRoute>
                } 
              />
              <Route 
                path="horarios" 
                element={
                  <RoleBasedRoute allowedRoles={['docente', 'estudiante']} showUnauthorized>
                    <div>Horarios (En desarrollo)</div>
                  </RoleBasedRoute>
                } 
              />
              <Route 
                path="reportes-docente" 
                element={
                  <RoleBasedRoute allowedRoles={['docente']} showUnauthorized>
                    <div>Reportes de Docente (En desarrollo)</div>
                  </RoleBasedRoute>
                } 
              />

              {/* Rutas específicas para Estudiante */}
              <Route 
                path="mis-notas" 
                element={
                  <RoleBasedRoute allowedRoles={['estudiante']} showUnauthorized>
                    <div>Mis Notas (En desarrollo)</div>
                  </RoleBasedRoute>
                } 
              />
              <Route 
                path="mis-inscripciones" 
                element={
                  <RoleBasedRoute allowedRoles={['estudiante']} showUnauthorized>
                    <div>Mis Inscripciones (En desarrollo)</div>
                  </RoleBasedRoute>
                } 
              />
              <Route 
                path="mis-horarios" 
                element={
                  <RoleBasedRoute allowedRoles={['estudiante']} showUnauthorized>
                    <div>Mis Horarios (En desarrollo)</div>
                  </RoleBasedRoute>
                } 
              />
              <Route 
                path="historial-academico" 
                element={
                  <RoleBasedRoute allowedRoles={['estudiante']} showUnauthorized>
                    <div>Historial Académico (En desarrollo)</div>
                  </RoleBasedRoute>
                } 
              />

              {/* Configuración - accesible para todos */}
              <Route 
                path="settings" 
                element={
                  <div>Configuración del Sistema (En desarrollo)</div>
                } 
              />

              {/* Redirección por defecto al dashboard */}
              <Route path="" element={<Navigate to="/dashboard" replace />} />
            </Route>

            {/* Páginas de error */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/404" element={<NotFoundPage />} />

            {/* Redirección de la raíz */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Catch-all para rutas no encontradas */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
        
        {/* Toaster para notificaciones */}
        <Toaster 
          position="top-right"
          richColors
          closeButton
          expand={true}
          duration={4000}
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
