import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tripalfa/ui-components': path.resolve(__dirname, '../../packages/ui-components'),
      '@tripalfa/shared-types': path.resolve(__dirname, '../../packages/shared-types'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Proxy API requests through Local Gateway (port 8000)
      '/api': {
        target: process.env.VITE_GATEWAY_URL || 'http://localhost:8000',
        changeOrigin: true,
      },
      // B2B tenant API routes
      '/tenant': {
        target: process.env.VITE_GATEWAY_URL || 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  // Build configuration to address large chunk warnings
  build: {
    // Increase the chunk size warning limit (default is 500KB)
    // Adjust this value as needed; here we set it to 1000KB to suppress the warning
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Split vendor libraries into separate chunks to improve caching and reduce individual chunk size
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-query';
            }
            return 'vendor-core';
          }
        },
      },
    },
  },
})
