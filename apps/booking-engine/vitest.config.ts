import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
      ],
    },
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/**/*.spec.ts', 'src/**/*.spec.tsx'],
    pool: 'forks',
    singleFork: true,
  },
  resolve: {
    alias: {
      '@tripalfa/shared-utils': path.resolve(__dirname, '../../packages/shared-utils'),
      '@tripalfa/static-data': path.resolve(__dirname, '../../packages/static-data/src'),
      'lucide-react': path.resolve(__dirname, './src/__tests__/mocks/lucide-react.ts'),
    },
  },
});

