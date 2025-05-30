import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="h-screen bg-secondary-50 flex flex-col">
      {/* Header */}
      <Header 
        onMenuToggle={handleMenuToggle}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      <div className="flex flex-1 h-0">
        {/* Sidebar */}
        <div className="flex-shrink-0 h-full">
          <Sidebar 
            isOpen={isMobileMenuOpen}
            onClose={handleMenuClose}
          />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto min-w-0 h-full">
          <div className="p-4 sm:p-6 lg:p-8 min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
