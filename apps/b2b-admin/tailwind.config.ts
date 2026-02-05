import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../../packages/ui-components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          500: '#8b5cf6',
          600: '#7c3aed'
        },
        secondary: {
          50: '#f5f7fa',
          200: '#d5d9e2',
          300: '#aeb4c5',
          400: '#7c8599',
          500: '#3b82f6',
          900: '#0f1d3b'
        },
        success: {
          500: '#22c55e',
          600: '#16a34a'
        },
        warning: {
          500: '#f97316'
        },
        error: {
          500: '#ef4444'
        }
      },
      boxShadow: {
        xs: '0 2px 10px rgba(15, 29, 59, 0.08)',
        soft: '0 25px 50px -12px rgba(15, 29, 59, 0.25)'
      },
      fontFamily: {
        display: ['"Inter"', 'ui-sans-serif', 'system-ui'],
        body: ['"Inter"', 'ui-sans-serif', 'system-ui']
      }
    }
  },
  plugins: []
};

export default config;
