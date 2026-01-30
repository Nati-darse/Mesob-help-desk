import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import axios from 'axios';
import './i18n'; // Initialize i18n

// Configure axios base URL for development
// Axios configuration with interceptors
axios.defaults.baseURL = import.meta.env.VITE_SERVER_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';
axios.defaults.withCredentials = true;

// Request interceptor: Attach token and tenant ID to every request
axios.interceptors.request.use(
  (config) => {
    const userData = sessionStorage.getItem('mesob_user');
    if (userData) {
      const user = JSON.parse(userData);

      // Attach Authorization token
      if (user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }

      // Attach x-tenant-id for non-global admins
      const globalAdminRoles = ['Super Admin', 'System Admin'];
      if (!globalAdminRoles.includes(user.role) && user.companyId) {
        config.headers['x-tenant-id'] = String(user.companyId);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle global errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;

    // Handle Maintenance Mode
    if (response && response.status === 503) {
      if (!window.location.pathname.includes('/maintenance')) {
        window.location.href = '/maintenance';
      }
    }

    // Handle Unauthorized / Token Expired
    if (response && response.status === 401) {
      const isLoginPath = window.location.pathname.includes('/login');
      const isAuthReq = response.config?.url?.includes('/api/auth');

      // Only redirect if not already on login and not a login attempt
      if (!isLoginPath && !isAuthReq) {
        console.warn('[AUTH] Unauthorized access detected, redirecting to login');
        sessionStorage.removeItem('mesob_user');
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
