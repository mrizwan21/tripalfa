import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

const __dirname = import.meta.dirname

export default defineConfig([
globalIgnores(['dist', 'tailwind.config.js', 'vite.config.ts', 'vite-env.d.ts']),
{
files: ['**/*.{ts,tsx}'],
extends: [
js.configs.recommended,
tseslint.configs.recommended,
reactHooks.configs.flat.recommended,
reactRefresh.configs.vite,
],
languageOptions: {
ecmaVersion: 2020,
globals: globals.browser,
parserOptions: {
project: './tsconfig.app.json',
tsconfigRootDir: __dirname,
},
},
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'no-constant-binary-expression': 'off',
      'no-case-declarations': 'off',
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
    },
  },
])
