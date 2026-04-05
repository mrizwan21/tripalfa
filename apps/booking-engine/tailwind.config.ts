import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}', '../../packages/ui-components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Fonts
      fontFamily: {
        display: [
          '"Inter"',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'sans-serif',
        ],
        body: [
          '"Inter"',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'sans-serif',
        ],
      },

      // Typography - Headings
      fontSize: {
        'heading-72': ['72px', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '700' }],
        'heading-64': ['64px', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '700' }],
        'heading-56': ['56px', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '700' }],
        'heading-48': ['48px', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '700' }],
        'heading-40': ['40px', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '700' }],
        'heading-32': ['32px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'heading-24': ['24px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'heading-20': ['20px', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '700' }],
        'heading-16': ['16px', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '700' }],
        'heading-14': ['14px', { lineHeight: '1.4', letterSpacing: '-0.01em', fontWeight: '700' }],
        // Body Text
        'body-lg': ['18px', { lineHeight: '1.5', letterSpacing: '0em', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '1.5', letterSpacing: '0em', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '1.5', letterSpacing: '0em', fontWeight: '400' }],
        caption: ['12px', { lineHeight: '1.5', letterSpacing: '0.01em', fontWeight: '400' }],
      },

      colors: {
        // Semantic base
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',

        // Primary - Navy brand
        primary: {
          DEFAULT: 'rgb(21 36 103)',
          foreground: 'rgb(255 255 255)',
          50: 'rgb(229 233 246)',
          100: 'rgb(204 211 239)',
          200: 'rgb(153 177 224)',
          300: 'rgb(102 144 209)',
          400: 'rgb(66 121 199)',
          500: 'rgb(36 82 174)',
          600: 'rgb(21 36 103)',
          700: 'rgb(10 28 80)',
          800: 'rgb(8 21 60)',
          900: 'rgb(6 16 46)',
        },

        // Secondary
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },

        // Destructive/Error - Red
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },

        // Muted for secondary content
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },

        // Accent for highlights and CTAs
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

        // Semantic colors - prefer these over raw colors
        success: {
          DEFAULT: 'rgb(16 185 129)',
          foreground: 'rgb(255 255 255)',
          50: 'rgb(240 253 244)',
          100: 'rgb(220 252 231)',
          200: 'rgb(187 239 99)',
          300: 'rgb(134 239 172)',
          400: 'rgb(74 222 128)',
          500: 'rgb(34 197 94)',
          600: 'rgb(16 185 129)',
          700: 'rgb(5 150 105)',
          800: 'rgb(4 120 87)',
          900: 'rgb(6 95 70)',
        },
        warning: {
          DEFAULT: 'rgb(245 158 11)',
          foreground: 'rgb(0 0 0)',
          50: 'rgb(255 251 235)',
          100: 'rgb(254 243 199)',
          200: 'rgb(253 230 138)',
          300: 'rgb(252 211 77)',
          400: 'rgb(251 191 36)',
          500: 'rgb(245 158 11)',
          600: 'rgb(217 119 6)',
          700: 'rgb(180 83 9)',
          800: 'rgb(146 64 14)',
          900: 'rgb(120 53 15)',
        },
        error: {
          DEFAULT: 'rgb(239 68 68)',
          foreground: 'rgb(255 255 255)',
          50: 'rgb(254 242 242)',
          100: 'rgb(254 226 226)',
          200: 'rgb(254 202 202)',
          300: 'rgb(252 165 165)',
          400: 'rgb(248 113 113)',
          500: 'rgb(239 68 68)',
          600: 'rgb(220 38 38)',
          700: 'rgb(185 28 28)',
          800: 'rgb(153 27 27)',
          900: 'rgb(127 29 29)',
        },

        // Neutrals for backgrounds and text
        neutral: {
          50: 'rgb(248 250 252)',
          100: 'rgb(241 245 249)',
          200: 'rgb(226 232 240)',
          300: 'rgb(203 213 225)',
          400: 'rgb(148 163 184)',
          500: 'rgb(100 116 139)',
          600: 'rgb(71 85 105)',
          700: 'rgb(51 65 85)',
          800: 'rgb(30 41 59)',
          900: 'rgb(15 23 42)',
          950: 'rgb(3 7 18)',
        },

        // Brand accent - Red for ratings/highlights
        accent: {
          DEFAULT: 'rgb(236 92 76)',
          50: 'rgb(254 240 238)',
          100: 'rgb(253 226 222)',
          200: 'rgb(252 199 190)',
          300: 'rgb(250 155 133)',
          400: 'rgb(247 111 77)',
          500: 'rgb(236 92 76)',
          600: 'rgb(211 66 42)',
          700: 'rgb(175 42 28)',
          800: 'rgb(139 38 23)',
          900: 'rgb(112 34 23)',
        },

        // Primary - Navy
        primary: {
          DEFAULT: 'rgb(21 36 103)',
          50: 'rgb(229 233 246)',
          100: 'rgb(204 211 239)',
          200: 'rgb(153 177 224)',
          300: 'rgb(102 144 209)',
          400: 'rgb(66 121 199)',
          500: 'rgb(36 82 174)',
          600: 'rgb(21 36 103)',
          700: 'rgb(10 28 80)',
          800: 'rgb(8 21 60)',
          900: 'rgb(6 16 46)',
        },
      },
      borderRadius: {
        DEFAULT: '4px',
        xs: '4px',
        sm: '4px',
        md: '4px',
        lg: '8px',
        xl: '1rem',
        '2xl': '16px',
        '3xl': '2rem',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
