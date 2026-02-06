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
    port: 3002,
    proxy: {
      '/duffel-api': {
        target: 'https://api.duffel.com/air',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/duffel-api/, ''),
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
