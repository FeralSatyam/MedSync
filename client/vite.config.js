import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({
    fastRefresh: true,
    babel: {
      plugins: [
        ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]
      ]
    }
  })],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    },
    hmr: {
      overlay: true
    },
    watch: {
      usePolling: false,
      interval: 100
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'zustand', 'react-hot-toast'],
    exclude: ['@react-google-maps/api']
  },
  build: {
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020',
    // Remove manualChunks object, use function instead or remove entirely
    rollupOptions: {
      output: {
        // Use a function for manualChunks instead of an object
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('leaflet') || id.includes('react-leaflet')) {
              return 'vendor-map';
            }
            if (id.includes('zustand') || id.includes('react-hot-toast')) {
              return 'vendor-ui';
            }
            if (id.includes('@tensorflow') || id.includes('tfjs')) {
              return 'vendor-ai';
            }
            return 'vendor';
          }
        }
      }
    }
  }
})