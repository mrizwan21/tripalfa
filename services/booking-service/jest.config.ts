export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': ['ts-jest', { 
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        module: 'commonjs',
        target: 'ES2020',
        strict: true,
        skipLibCheck: true
      }
    }]
  },
  setupFiles: ['<rootDir>/src/__tests__/env-setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testMatch: [
    '**/__tests__/**/*.test.[jt]s',
    '**/__tests__/**/*.spec.[jt]s',
    '**/tests/**/*.test.[jt]s',
    '**/tests/**/*.spec.[jt]s',
    '**/*.test.[jt]s',
    '**/*.spec.[jt]s'
  ],
  testPathIgnorePatterns: [
    'node_modules',
    'dist',
    'coverage'
  ],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/database/index.ts'
  ],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    'node_modules',
    'dist',
    'coverage'
  ],
  // Global setup for integration tests
  globalSetup: process.env.INTEGRATION_DB === 'true' ? '<rootDir>/tests/integration/global-setup.ts' : undefined,
  globalTeardown: process.env.INTEGRATION_DB === 'true' ? '<rootDir>/tests/integration/global-teardown.ts' : undefined,
  // Test timeout for integration tests
  testTimeout: process.env.INTEGRATION_DB === 'true' ? 60000 : 10000
};
