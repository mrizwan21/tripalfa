import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  mode: 'development',
  plugins: [
    react({
      jsxRuntime: 'automatic',
    })
  ],
  resolve: {
    alias: {
      '@/components/ui': path.resolve(__dirname, '../../packages/ui-components/ui'),
      '@/components/dashboard': path.resolve(__dirname, './src/features/dashboard/components'),
      '@/lib': path.resolve(__dirname, './src/shared/lib'),
      '@': path.resolve(__dirname, './src'),
      '@tripalfa/shared-utils': path.resolve(__dirname, '../../packages/shared-utils'),
      '@tripalfa/shared-types': path.resolve(__dirname, '../../packages/shared-types'),
      '@tripalfa/ui-components': path.resolve(__dirname, '../../packages/ui-components'),
    },
  },
  server: {
    port: 5177,
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:3000',
        changeOrigin: true
      },
      '/static': {
        target: process.env.VITE_STATIC_DATA_URL || 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/static/, '')
      }
    }
  }
});
