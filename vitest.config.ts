import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['**/__tests__/**/*.test.ts'],
    exclude: ['node_modules', '**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['json', 'text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'apps/**/src/**/*.ts',
        'apps/**/src/**/*.tsx',
        'services/**/src/**/*.ts',
        'packages/**/src/**/*.ts',
      ],
      exclude: [
        'node_modules/',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/index.ts',
      ],
    },
  },
  workspace: {
    maximumConfigs: 50,
  },
});
