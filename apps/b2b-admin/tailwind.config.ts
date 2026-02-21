import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';
import plugin from 'tailwindcss/plugin';

const config: Config = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // Modern color palette
      colors: {
        // CSS variable fallbacks
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        
        // Primary Blue
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#3B82F6', // Primary Blue
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        
        // Secondary Purple
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#A855F7', // Secondary Purple
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
        },
        
        // Status Colors
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        
        // Success Green
        success: {
          DEFAULT: '#10b981',
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbef63',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#10b981',
          700: '#059669',
          800: '#047857',
          900: '#065f46',
        },
        
        // Warning Yellow
        warning: {
          DEFAULT: '#fbbf24',
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        
        // Error Red
        error: {
          DEFAULT: '#ef4444',
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        
        // Neutral Colors
        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      
      // Extended border radius
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xs: '0.25rem',
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      
      // Enhanced shadow system
      boxShadow: {
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        sm: '0 2px 4px 0 rgb(0 0 0 / 0.08)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.15)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.15)',
        flat: '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        card: '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        elevated: '0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
        soft: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        glow: '0 0 20px -5px rgb(99 102 241 / 0.4)',
        'glow-lg': '0 0 40px -10px rgb(99 102 241 / 0.5)',
        'blue-glow': '0 0 20px rgb(59 130 246 / 0.3)',
        'purple-glow': '0 0 20px rgb(168 85 247 / 0.3)',
        'green-glow': '0 0 20px rgb(16 185 129 / 0.3)',
        'red-glow': '0 0 20px rgb(239 68 68 / 0.3)',
      },
      
      // Gradient backgrounds
      backgroundImage: {
        'gradient-primary': 'linear-gradient(to right, #3B82F6, #A855F7)',
        'gradient-primary-dark': 'linear-gradient(to right, #2563EB, #9333EA)',
        'gradient-success': 'linear-gradient(to right, #10B981, #059669)',
        'gradient-warning': 'linear-gradient(to right, #FBBF24, #F97316)',
        'gradient-error': 'linear-gradient(to right, #EF4444, #DC2626)',
        'gradient-dashboard': 'linear-gradient(135deg, #F0F9FF, #FDF2F8, #F8FAFC)',
        'gradient-dashboard-dark': 'linear-gradient(135deg, #0F172A, #1E1B4B, #0F172A)',
      },
      
      // Animations
      animation: {
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'fade-in': 'fadeIn 0.3s ease-in',
        'fade-out': 'fadeOut 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'shimmer': 'shimmer 2s infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      
      // Keyframes
      keyframes: {
        slideUp: {
          '0%': { height: '0', opacity: '0' },
          '100%': { height: '100%', opacity: '1' },
        },
        slideDown: {
          '0%': { height: '100%', opacity: '1' },
          '100%': { height: '0', opacity: '0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      
      // Transition durations
      transitionDuration: {
        0: '0ms',
        75: '75ms',
        100: '100ms',
        150: '150ms',
        200: '200ms',
        300: '300ms',
        500: '500ms',
        700: '700ms',
        1000: '1000ms',
      },
      
      // Fonts
      fontFamily: {
        display: ['"Inter"', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        body: ['"Inter"', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      
      // Backdrop blur
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '40px',
      },
      
      // Z-index scale
      zIndex: {
        0: '0',
        10: '10',
        20: '20',
        30: '30',
        40: '40',
        50: '50',
        auto: 'auto',
        dropdown: '1000',
        sticky: '1020',
        fixed: '1030',
        backdrop: '1040',
        offcanvas: '1050',
        modal: '1060',
        popover: '1070',
        tooltip: '1080',
      },
    }
  },
  
  plugins: [
    // Glassmorphism effect
    plugin(function({ addUtilities }) {
      const glassUtilities = {
        '.glass': {
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(12px)',
          webkitBackdropFilter: 'blur(12px)',
        },
        '.glass-dark': {
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(12px)',
          webkitBackdropFilter: 'blur(12px)',
        },
        '.glass-gradient': {
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
          backdropFilter: 'blur(12px)',
          webkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
      };
      addUtilities(glassUtilities);
    }),
    
    // Smooth transitions plugin
    plugin(function({ addUtilities }) {
      const smoothTransitions = {
        '.transition-smooth': {
          transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        },
        '.transition-smooth-fast': {
          transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        },
        '.transition-smooth-slow': {
          transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
        },
      };
      addUtilities(smoothTransitions);
    }),
  ]
};

export default config;
