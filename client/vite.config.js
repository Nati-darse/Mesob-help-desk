import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-mui-core': ['@mui/material', '@emotion/react', '@emotion/styled'],
          'vendor-mui-icons': ['@mui/icons-material'],
          'vendor-mui-grid': ['@mui/x-data-grid'],
          'vendor-mui-lab': ['@mui/lab'],
          'vendor-charts': ['recharts', 'chart.js', 'react-chartjs-2'],
          'vendor-react': ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
          'vendor-utils': ['axios', 'date-fns', 'socket.io-client', 'formik', 'yup', 'lucide-react']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['@emotion/react', '@emotion/styled'],
  },
})
