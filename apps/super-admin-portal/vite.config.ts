import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import path from "path"

function manualChunks(id: string): string | undefined {
  if (id.includes('node_modules')) {
    if (id.includes('react')) return 'react-vendor'
    if (id.includes('@radix-ui') || id.includes('lucide-react')) return 'ui-vendor'
    if (id.includes('axios') || id.includes('clsx') || id.includes('class-variance')) return 'utils-vendor'
    if (id.includes('@tripalfa')) return 'tripalfa-vendor'
  }
}

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  define: {
    'global': 'window',
    'process.env': {},
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'es2022',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks,
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tripalfa/ui-components',
      '@tripalfa/auth-client',
    ],
    force: true,
  },
  server: {
    port: 5175,
    hmr: {
      overlay: true,
    },
  },
})