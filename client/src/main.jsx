import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import axios from 'axios';

// Configure axios base URL for production
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

// Add global interceptor for Maintenance Mode and Token Expiration
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle Maintenance Mode
    if (error.response && error.response.status === 503) {
      if (!window.location.pathname.includes('/maintenance') && !window.location.pathname.includes('/sys-admin')) {
        window.location.href = '/maintenance';
      }
    }
    
    // Handle Token Expiration
    if (error.response && error.response.status === 401) {
      // Clear authentication data
      localStorage.removeItem('mesob_user');
      delete axios.defaults.headers.common['Authorization'];
      delete axios.defaults.headers.common['x-tenant-id'];
      
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        alert('Your session has expired. Please log in again.');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
