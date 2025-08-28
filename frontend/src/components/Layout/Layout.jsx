import React from 'react';
import { Outlet } from 'react-router-dom'; // Add this import
import Navbar from './Navbar';

const Layout = () => { // Remove { children } parameter
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Outlet /> {/* Replace {children} with <Outlet /> */}
      </main>
    </div>
  );
};

export default Layout;