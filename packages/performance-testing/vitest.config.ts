import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.bench.ts'],
    benchmark: {
      include: ['src/**/*.bench.ts'],
      outputFile: {
        json: './benchmark-results/latest.json',
      },
      iterations: 5,        // Reduced from 10
      warmupIterations: 1,  // Reduced from 2
      warmupTime: 50,       // Reduced from 100
    },
    globals: true,
    testTimeout: 120000,   // Increase test timeout
  },
});
