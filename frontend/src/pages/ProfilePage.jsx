import React from 'react';
import ProfileView from '../components/auth/ProfileView';

const ProfilePage = () => {
  return (
    <div className="space-y-6">
      <div className="border-b border-secondary-200 pb-4">
        <h1 className="text-2xl font-bold text-secondary-900">Mi Perfil</h1>
        <p className="text-secondary-600 mt-1">
          Gestiona tu información personal y configuración de cuenta
        </p>
      </div>
      
      <ProfileView />
    </div>
  );
};

export default ProfilePage;
