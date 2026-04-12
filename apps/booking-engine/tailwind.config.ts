import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';
import plugin from 'tailwindcss/plugin';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}', '../../packages/ui-components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      spacing: {
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '2.5': '10px',
        '3': '12px',
        '3.5': '14px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        '9': '36px',
        '10': '40px',
        '11': '44px',
        '12': '48px',
        '14': '56px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
        'page-x': '16px',
        'page-x-lg': '24px',
        'page-y': '24px',
        'page-y-lg': '32px',
        section: '32px',
        'section-lg': '48px',
        card: '16px',
        'card-lg': '24px',
        'input-x': '12px',
        'input-y': '8px',
        list: '8px',
        'list-lg': '12px',
      },
      fontFamily: {
        display: [
          '"Inter"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"Helvetica Neue"',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        body: [
          '"Inter"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"Helvetica Neue"',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },

      fontSize: {
        'display-hero': [
          '56px',
          { lineHeight: '1.07', letterSpacing: '-0.28px', fontWeight: '600' },
        ],
        'section-heading': [
          '40px',
          { lineHeight: '1.10', letterSpacing: 'normal', fontWeight: '600' },
        ],
        'tile-heading': [
          '28px',
          { lineHeight: '1.14', letterSpacing: '0.196px', fontWeight: '400' },
        ],
        'card-title': ['21px', { lineHeight: '1.19', letterSpacing: '0.231px', fontWeight: '700' }],
        'sub-heading': [
          '21px',
          { lineHeight: '1.19', letterSpacing: '0.231px', fontWeight: '400' },
        ],
        'body-apple': [
          '17px',
          { lineHeight: '1.47', letterSpacing: '-0.374px', fontWeight: '400' },
        ],
        'body-emphasis': [
          '17px',
          { lineHeight: '1.24', letterSpacing: '-0.374px', fontWeight: '600' },
        ],
        'link-caption': [
          '14px',
          { lineHeight: '1.43', letterSpacing: '-0.224px', fontWeight: '400' },
        ],
        'caption-bold': [
          '14px',
          { lineHeight: '1.29', letterSpacing: '-0.224px', fontWeight: '600' },
        ],
        micro: ['12px', { lineHeight: '1.33', letterSpacing: '-0.12px', fontWeight: '400' }],
        'micro-bold': ['12px', { lineHeight: '1.33', letterSpacing: '-0.12px', fontWeight: '600' }],
        nano: ['10px', { lineHeight: '1.47', letterSpacing: '-0.08px', fontWeight: '400' }],
      },

      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',

        apple: {
          blue: '#0071e3',
          'link-blue': '#0066cc',
          'bright-blue': '#2997ff',
          black: '#000000',
          'light-gray': '#f5f5f7',
          'near-black': '#1d1d1f',
          'dark-surface-1': '#272729',
          'dark-surface-2': '#28282a',
          'dark-surface-3': '#2a2a2d',
          'dark-surface-4': '#242426',
          'button-active': '#ededf2',
          'filter-bg': '#fafafc',
        },

        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50: 'rgb(240 245 255)',
          100: 'rgb(224 234 255)',
          200: 'rgb(178 210 255)',
          300: 'rgb(102 163 255)',
          400: 'rgb(41 151 255)',
          500: 'rgb(0 113 227)',
          600: 'rgb(0 102 204)',
          700: 'rgb(0 82 163)',
          800: 'rgb(0 61 122)',
          900: 'rgb(0 41 82)',
        },

        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },

        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },

        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },

        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },

        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        success: {
          DEFAULT: 'rgb(0 139 0)',
          foreground: 'rgb(255 255 255)',
          50: 'rgb(240 255 240)',
          100: 'rgb(200 255 200)',
          200: 'rgb(100 230 100)',
          300: 'rgb(50 205 50)',
          400: 'rgb(34 197 94)',
          500: 'rgb(0 139 0)',
          600: 'rgb(0 110 0)',
          700: 'rgb(0 80 0)',
          800: 'rgb(0 55 0)',
          900: 'rgb(0 30 0)',
        },
        warning: {
          DEFAULT: 'rgb(255 149 0)',
          foreground: 'rgb(0 0 0)',
          50: 'rgb(255 248 235)',
          100: 'rgb(255 238 204)',
          200: 'rgb(255 213 128)',
          300: 'rgb(255 179 51)',
          400: 'rgb(255 149 0)',
          500: 'rgb(204 119 0)',
          600: 'rgb(153 89 0)',
          700: 'rgb(102 60 0)',
          800: 'rgb(77 45 0)',
          900: 'rgb(51 30 0)',
        },
        error: {
          DEFAULT: 'rgb(255 59 48)',
          foreground: 'rgb(255 255 255)',
          50: 'rgb(255 242 241)',
          100: 'rgb(255 219 217)',
          200: 'rgb(255 173 168)',
          300: 'rgb(255 127 118)',
          400: 'rgb(255 69 58)',
          500: 'rgb(255 59 48)',
          600: 'rgb(214 48 39)',
          700: 'rgb(173 38 30)',
          800: 'rgb(132 28 21)',
          900: 'rgb(91 19 15)',
        },

        neutral: {
          50: 'rgb(245 245 247)',
          100: 'rgb(229 229 234)',
          200: 'rgb(209 209 214)',
          300: 'rgb(199 199 204)',
          400: 'rgb(142 142 147)',
          500: 'rgb(99 99 102)',
          600: 'rgb(72 72 74)',
          700: 'rgb(58 58 60)',
          800: 'rgb(44 44 46)',
          900: 'rgb(29 29 31)',
          950: 'rgb(0 0 0)',
        },
      },
      borderRadius: {
        DEFAULT: '8px',
        xs: '5px',
        sm: '8px',
        md: '8px',
        lg: '11px',
        xl: '12px',
        '2xl': '16px',
        '3xl': '2rem',
        pill: '980px',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),

    plugin(function ({ addUtilities }) {
      const spacingUtilities = {
        '.page-container': {
          paddingLeft: 'var(--space-page-x, 16px)',
          paddingRight: 'var(--space-page-x, 16px)',
          paddingTop: 'var(--space-page-y, 24px)',
          paddingBottom: 'var(--space-page-y, 24px)',
          marginLeft: 'auto',
          marginRight: 'auto',
          maxWidth: '1280px',
          width: '100%',
        },
        '.page-container-lg': {
          paddingLeft: 'var(--space-page-x-lg, 24px)',
          paddingRight: 'var(--space-page-x-lg, 24px)',
          paddingTop: 'var(--space-page-y-lg, 32px)',
          paddingBottom: 'var(--space-page-y-lg, 32px)',
          marginLeft: 'auto',
          marginRight: 'auto',
          maxWidth: '1280px',
          width: '100%',
        },
        '.section-spacing': {
          marginBottom: 'var(--space-section, 32px)',
        },
        '.section-spacing-lg': {
          marginBottom: 'var(--space-section-lg, 48px)',
        },
        '.card-padding': {
          padding: 'var(--space-card, 16px)',
        },
        '.card-padding-lg': {
          padding: 'var(--space-card-lg, 24px)',
        },
        '.list-spacing': {
          gap: 'var(--space-list, 8px)',
        },
        '.list-spacing-lg': {
          gap: 'var(--space-list-lg, 12px)',
        },
      };
      addUtilities(spacingUtilities);
    }),
  ],
};

export default config;
