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
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['react-hot-toast', 'zustand'],
          'map-vendor': ['leaflet', 'react-leaflet']
        }
      }
    }
  }
})