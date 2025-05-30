import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const UnauthorizedPage = () => {
  return (
    <div className="min-h-screen bg-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card>
          <Card.Content className="p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-secondary-900 mb-4">
              Acceso No Autorizado
            </h1>
            
            <p className="text-secondary-600 mb-6">
              No tienes permisos para acceder a esta página. Si crees que esto es un error, 
              contacta al administrador del sistema.
            </p>
            
            <div className="space-y-3">
              <Link to="/dashboard">
                <Button className="w-full" icon={<ArrowLeft />}>
                  Volver al Dashboard
                </Button>
              </Link>
              
              <Link to="/profile">
                <Button variant="outline" className="w-full">
                  Ver Mi Perfil
                </Button>
              </Link>
            </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
