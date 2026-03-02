import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";
import plugin from "tailwindcss/plugin";

const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Modern color palette
      colors: {
        // CSS variable fallbacks
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        // Primary Blue
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: "rgb(240 249 255)",
          100: "rgb(224 242 254)",
          200: "rgb(186 230 253)",
          300: "rgb(125 211 252)",
          400: "rgb(56 189 248)",
          500: "rgb(14 165 233)",
          600: "rgb(59 130 246)", // Primary Blue
          700: "rgb(29 78 216)",
          800: "rgb(30 64 175)",
          900: "rgb(30 58 138)",
        },

        // Secondary Purple
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          50: "rgb(250 245 255)",
          100: "rgb(243 232 255)",
          200: "rgb(233 213 255)",
          300: "rgb(216 180 254)",
          400: "rgb(192 132 252)",
          500: "rgb(168 85 247)", // Secondary Purple
          600: "rgb(147 51 234)",
          700: "rgb(126 34 206)",
          800: "rgb(107 33 168)",
          900: "rgb(88 28 135)",
        },

        // Status Colors
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },

        // Success Green
        success: {
          DEFAULT: "rgb(16 185 129)",
          50: "rgb(240 253 244)",
          100: "rgb(220 252 231)",
          200: "rgb(187 239 99)",
          300: "rgb(134 239 172)",
          400: "rgb(74 222 128)",
          500: "rgb(34 197 94)",
          600: "rgb(16 185 129)",
          700: "rgb(5 150 105)",
          800: "rgb(4 120 87)",
          900: "rgb(6 95 70)",
        },

        // Warning Yellow
        warning: {
          DEFAULT: "rgb(251 191 36)",
          50: "rgb(255 251 235)",
          100: "rgb(254 243 199)",
          200: "rgb(253 230 138)",
          300: "rgb(252 211 77)",
          400: "rgb(251 191 36)",
          500: "rgb(245 158 11)",
          600: "rgb(217 119 6)",
          700: "rgb(180 83 9)",
          800: "rgb(146 64 14)",
          900: "rgb(120 53 15)",
        },

        // Error Red
        error: {
          DEFAULT: "rgb(239 68 68)",
          50: "rgb(254 242 242)",
          100: "rgb(254 226 226)",
          200: "rgb(254 202 202)",
          300: "rgb(252 165 165)",
          400: "rgb(248 113 113)",
          500: "rgb(239 68 68)",
          600: "rgb(220 38 38)",
          700: "rgb(185 28 28)",
          800: "rgb(153 27 27)",
          900: "rgb(127 29 29)",
        },

        // Neutral Colors
        neutral: {
          50: "rgb(248 250 252)",
          100: "rgb(241 245 249)",
          200: "rgb(226 232 240)",
          300: "rgb(203 213 225)",
          400: "rgb(148 163 184)",
          500: "rgb(100 116 139)",
          600: "rgb(71 85 105)",
          700: "rgb(51 65 85)",
          800: "rgb(30 41 59)",
          900: "rgb(15 23 42)",
        },
      },

      // Extended border radius
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "0.25rem",
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },

      // Enhanced shadow system
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        sm: "0 2px 4px 0 rgb(0 0 0 / 0.08)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        lg: "0 10px 15px -3px rgb(0 0 0 / 0.15)",
        xl: "0 20px 25px -5px rgb(0 0 0 / 0.15)",
        flat: "0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        card: "0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        elevated:
          "0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)",
        soft: "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
        glow: "0 0 20px -5px rgb(99 102 241 / 0.4)",
        "glow-lg": "0 0 40px -10px rgb(99 102 241 / 0.5)",
        "blue-glow": "0 0 20px rgb(59 130 246 / 0.3)",
        "purple-glow": "0 0 20px rgb(168 85 247 / 0.3)",
        "green-glow": "0 0 20px rgb(16 185 129 / 0.3)",
        "red-glow": "0 0 20px rgb(239 68 68 / 0.3)",
      },

      // Gradient backgrounds
      backgroundImage: {
        "gradient-primary":
          "linear-gradient(to right, rgb(59 130 246), rgb(168 85 247))",
        "gradient-primary-dark":
          "linear-gradient(to right, rgb(37 99 235), rgb(147 51 234))",
        "gradient-success":
          "linear-gradient(to right, rgb(16 185 129), rgb(5 150 105))",
        "gradient-warning":
          "linear-gradient(to right, rgb(251 191 36), rgb(249 115 22))",
        "gradient-error":
          "linear-gradient(to right, rgb(239 68 68), rgb(220 38 38))",
        "gradient-dashboard":
          "linear-gradient(135deg, rgb(240 249 255), rgb(253 242 248), rgb(248 250 252))",
        "gradient-dashboard-dark":
          "linear-gradient(135deg, rgb(15 23 42), rgb(30 27 75), rgb(15 23 42))",
      },

      // Animations
      animation: {
        "slide-up": "slideUp 0.5s ease-out",
        "slide-down": "slideDown 0.5s ease-out",
        "fade-in": "fadeIn 0.3s ease-in",
        "fade-out": "fadeOut 0.3s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
        shimmer: "shimmer 2s infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },

      // Keyframes
      keyframes: {
        slideUp: {
          "0%": { height: "0", opacity: "0" },
          "100%": { height: "100%", opacity: "1" },
        },
        slideDown: {
          "0%": { height: "100%", opacity: "1" },
          "100%": { height: "0", opacity: "0" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },

      // Transition durations
      transitionDuration: {
        0: "0ms",
        75: "75ms",
        100: "100ms",
        150: "150ms",
        200: "200ms",
        300: "300ms",
        500: "500ms",
        700: "700ms",
        1000: "1000ms",
      },

      // Fonts
      fontFamily: {
        display: [
          '"Inter"',
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
        body: [
          '"Inter"',
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
      },

      // Backdrop blur
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        "2xl": "40px",
      },

      // Z-index scale
      zIndex: {
        0: "0",
        10: "10",
        20: "20",
        30: "30",
        40: "40",
        50: "50",
        auto: "auto",
        dropdown: "1000",
        sticky: "1020",
        fixed: "1030",
        backdrop: "1040",
        offcanvas: "1050",
        modal: "1060",
        popover: "1070",
        tooltip: "1080",
      },
    },
  },

  plugins: [
    // Glassmorphism effect
    plugin(function ({ addUtilities }) {
      const glassUtilities = {
        ".glass": {
          background: "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(12px)",
          webkitBackdropFilter: "blur(12px)",
        },
        ".glass-dark": {
          background: "rgba(15, 23, 42, 0.7)",
          backdropFilter: "blur(12px)",
          webkitBackdropFilter: "blur(12px)",
        },
        ".glass-gradient": {
          background:
            "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))",
          backdropFilter: "blur(12px)",
          webkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        },
      };
      addUtilities(glassUtilities);
    }),

    // Smooth transitions plugin
    plugin(function ({ addUtilities }) {
      const smoothTransitions = {
        ".transition-smooth": {
          transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        },
        ".transition-smooth-fast": {
          transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
        },
        ".transition-smooth-slow": {
          transition: "all 500ms cubic-bezier(0.4, 0, 0.2, 1)",
        },
      };
      addUtilities(smoothTransitions);
    }),
  ],
};

export default config;
