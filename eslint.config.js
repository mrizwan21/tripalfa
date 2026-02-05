import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        // Node.js globals
        URL: 'readonly',
        URLSearchParams: 'readonly',
        btoa: 'readonly',
        atob: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        globalThis: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      react,
      'react-hooks': reactHooks,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'prefer-const': 'off',
      'no-var': 'off',
      'react/prop-types': 'off',
      'no-undef': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'no-redeclare': 'off',
      'no-empty': 'off',
      'no-useless-escape': 'off',
      'no-case-declarations': 'off',
      'react/no-unescaped-entities': 'off',
      'react/no-unknown-property': 'off',
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  // Type declaration files adjustments
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  // Disallow JS sources (use TypeScript) - DISABLED
  // {
  //   files: ['**/*.{js,jsx,mjs,cjs}'],
  //   ignores: ['**/tests/**/*.cjs', '**/*.config.*', '**/eslint.config.*', '.codacy/**'],
  //   rules: {
  //     'no-restricted-syntax': [
  //       'error',
  //       {
  //         selector: 'Program',
  //         message: 'JavaScript source files are disallowed. Use TypeScript (.ts/.tsx) instead.',
  //       },
  //     ],
  //   },
  // },
  // Test files configuration
  {
    files: ['**/*.test.{js,ts,tsx}', '**/*.spec.{js,ts,tsx}', '**/tests/**/*.js', '**/tests/**/*.ts', '**/tests/**/*.tsx', '**/tests/**/*.cjs', '**/__tests__/**/*.js', '**/__tests__/**/*.ts', '**/__tests__/**/*.tsx', '**/__tests__/**/*.cjs'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    ignores: [
      'node_modules/**',
      '**/node_modules/**',
      '**/node_modules_old/**',
      'node_modules_trash/**',
      '**/node_modules_trash/**',
      'dist/**',
      '**/dist/**',
      'build/**',
      '**/build/**',
      '**/*.config.js',
      '**/*.config.ts',
      '**/*.config.mjs',
      '**/*.config.cjs',
      '.codacy/**',
      'coverage/**',
      '**/coverage/**',
      '.vscode/**',
      'docs/**',
      'infrastructure/**',
      'secrets/**',
      'wicked-config/**',
      '@workspace/**',
      'services/*/dist/**',
      'apps/*/dist/**',
      'packages/*/dist/**',
      'automapper/dist/**',
      '**/.vscode/extensions/**/typescript/lib/lib.dom.d.ts',
      '.vscode/extensions/**/typescript/lib/lib.dom.d.ts',
      '/Users/*/.vscode/extensions/**/typescript/lib/lib.dom.d.ts',
    ],
  },
];