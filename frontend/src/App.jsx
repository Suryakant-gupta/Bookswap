// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/common/ErrorBoundary';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/Layout/Layout';

// Auth components
import Signup from './components/Auth/Signup';
import Login from './components/Auth/Login';

// Page components
import Dashboard from './pages/Dashboard';
import MyBooks from './pages/MyBooks';
import SentRequests from './pages/SentRequests';
import ReceivedRequests from './pages/ReceivedRequests';

// Services
import authService from './services/auth';
import BookForm from './components/Books/BookForm';
import Profile from './pages/Profile';

function App() {
  console.log('App component rendering...')
  console.log('Auth service logged in:', authService.isLoggedIn())
  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                theme: {
                  primary: 'green',
                  secondary: 'black',
                },
              },
            }}
          />
          
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/login" 
              element={
                
                <Login />
              } 
            />
            <Route 
              path="/signup" 
              element={
                authService.isLoggedIn() ? 
                <Navigate to="/dashboard" replace /> : 
                <Signup />
              } 
            />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="my-books" element={<MyBooks />} />
              <Route path="requests/sent" element={<SentRequests />} />
              <Route path="requests/received" element={<ReceivedRequests />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App; 