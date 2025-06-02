import React from 'react';
import { Clock, User, FileText, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';

const AuditoriaDetalle = ({ log, onClose }) => {
  // Función para formatear los datos JSON
  const formatJSON = (value) => {
    if (!value) return '';
    try {
      // Si ya es un objeto, convertirlo a string
      if (typeof value === 'object') {
        return JSON.stringify(value, null, 2);
      }
      // Si es string, intentar parsearlo
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed, null, 2);
    } catch {
      // Si falla el parsing, devolver el valor original
      return value;
    }
  };

  // Función para formatear el User Agent
  const formatUserAgent = (ua) => {
    if (!ua) return '';
    try {
      // Extraer información básica del user agent
      const browser = ua.match(/(chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
      const os = ua.match(/windows nt|mac os x|linux/i) || ['Desconocido'];
      return `${browser[1] || 'Navegador'} ${browser[2] || ''} - ${os[0] || ''}`.trim();
    } catch {
      return ua;
    }
  };

  // Función para determinar el color según el tipo de acción
  const getActionColor = (action) => {
    switch (action) {
      case 'INSERT':
        return 'text-green-600';
      case 'UPDATE':
        return 'text-blue-600';
      case 'DELETE':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Información General */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center mb-4">
            <Clock className="w-5 h-5 text-primary-500 mr-2" />
            <h3 className="text-lg font-semibold text-secondary-900">Fecha y Hora</h3>
          </div>
          <p className="text-secondary-700">{new Date(log.fecha_accion).toLocaleString()}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center mb-4">
            <User className="w-5 h-5 text-primary-500 mr-2" />
            <h3 className="text-lg font-semibold text-secondary-900">Usuario</h3>
          </div>
          <p className="text-secondary-700">{log.usuario_nombre || log.usuario_correo || 'Sistema'}</p>
          {log.roles && (
            <p className="text-sm text-secondary-600 mt-1">
              Rol: {log.roles.includes('administrador') ? 'admin' : log.roles}
            </p>
          )}
          {log.ip_address && (
            <div className="mt-2 space-y-1">
              <p className="text-sm text-secondary-500">IP: {log.ip_address}</p>
              {log.user_agent && (
                <p className="text-sm text-secondary-500">
                  Navegador: {formatUserAgent(log.user_agent)}
                </p>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Detalles de la Acción */}
      <Card className="p-4">
        <div className="flex items-center mb-4">
          <AlertCircle className="w-5 h-5 text-primary-500 mr-2" />
          <h3 className="text-lg font-semibold text-secondary-900">Detalles de la Acción</h3>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-secondary-600">Tipo de Acción</p>
            <p className={`font-semibold ${getActionColor(log.accion)}`}>{log.accion}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-secondary-600">Tabla Afectada</p>
            <p className="text-secondary-900">{log.tabla_afectada}</p>
          </div>
        </div>
      </Card>

      {/* Datos Modificados */}
      {(log.valores_anteriores || log.valores_nuevos) && (
        <Card className="p-4">
          <div className="flex items-center mb-4">
            <FileText className="w-5 h-5 text-primary-500 mr-2" />
            <h3 className="text-lg font-semibold text-secondary-900">Datos Modificados</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {log.valores_anteriores && (
              <div className="w-full min-w-0">
                <p className="text-sm font-medium text-secondary-600 mb-2">Valores Anteriores</p>
                <pre className="bg-secondary-50 p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap break-words w-full max-w-full text-secondary-800 leading-relaxed font-mono">
                  {formatJSON(log.valores_anteriores)}
                </pre>
              </div>
            )}
            {log.valores_nuevos && (
              <div className="w-full min-w-0">
                <p className="text-sm font-medium text-secondary-600 mb-2">Valores Nuevos</p>
                <pre className="bg-secondary-50 p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap break-words w-full max-w-full text-secondary-800 leading-relaxed font-mono">
                  {formatJSON(log.valores_nuevos)}
                </pre>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Información Adicional */}
      {log.metadata && (
        <Card className="p-4">
          <div className="flex items-center mb-4">
            <FileText className="w-5 h-5 text-primary-500 mr-2" />
            <h3 className="text-lg font-semibold text-secondary-900">Información Adicional</h3>
          </div>
          <pre className="bg-secondary-50 p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap break-words w-full max-w-full text-secondary-800 leading-relaxed font-mono">
            {formatJSON(log.metadata)}
          </pre>
        </Card>
      )}

      {/* Botón de cerrar */}
      <div className="flex justify-end mt-6">
        <Button onClick={onClose} variant="secondary">
          Cerrar
        </Button>
      </div>
    </div>
  );
};

export default AuditoriaDetalle;
