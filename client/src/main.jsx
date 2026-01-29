import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import axios from 'axios';
import './i18n'; // Initialize i18n

// Configure axios base URL for development
axios.defaults.baseURL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

// Add global interceptor for Maintenance Mode
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 503) {
      if (!window.location.pathname.includes('/maintenance') && !window.location.pathname.includes('/sys-admin')) {
        window.location.href = '/maintenance';
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
