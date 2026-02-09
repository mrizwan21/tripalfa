import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Resolve local monorepo packages for Vite to avoid prebundling errors
      '@tripalfa/shared-utils': path.resolve(__dirname, '../../packages/shared-utils'),
      '@tripalfa/static-data': path.resolve(__dirname, '../../packages/static-data/src'),
    },
  },
  build: { outDir: "dist" },
  server: {
    port: 5174,
    proxy: {
      '/duffel-api': {
        target: 'https://api.duffel.com/air',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/duffel-api/, ''),
      },
      '/search': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/static': {
        target: 'http://localhost:3002', // Direct to inventory-service for performance
        changeOrigin: true,
      },
      '/inventory': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/inventory/, ''),
      },
    },
  },
});
