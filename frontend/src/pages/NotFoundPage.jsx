import React from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowLeft, Home } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card>
          <Card.Content className="p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-secondary-100 mb-6">
              <Search className="h-8 w-8 text-secondary-600" />
            </div>
            
            <h1 className="text-6xl font-bold text-secondary-900 mb-4">
              404
            </h1>
            
            <h2 className="text-2xl font-semibold text-secondary-800 mb-4">
              Página No Encontrada
            </h2>
            
            <p className="text-secondary-600 mb-6">
              La página que estás buscando no existe o ha sido movida. 
              Verifica la URL o regresa al inicio.
            </p>
            
            <div className="space-y-3">
              <Link to="/dashboard">
                <Button className="w-full" icon={<Home />}>
                  Ir al Dashboard
                </Button>
              </Link>
              
              <button 
                onClick={() => window.history.back()}
                className="w-full"
              >
                <Button variant="outline" className="w-full" icon={<ArrowLeft />}>
                  Volver Atrás
                </Button>
              </button>
            </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
};

export default NotFoundPage;
