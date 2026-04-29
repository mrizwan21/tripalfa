/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        display: ["var(--font-display)", 'sans-serif'],
        text: ["var(--font-text)", 'sans-serif'],
      },
      fontSize: {
        'nano':          ['0.625rem',  { lineHeight: '1.47', letterSpacing: '-0.08px' }],
        'micro':         ['0.75rem',   { lineHeight: '1.33', letterSpacing: '-0.12px' }],
        'caption':       ['0.875rem',  { lineHeight: '1.29', letterSpacing: '-0.224px' }],
        'body':          ['1.0625rem', { lineHeight: '1.47', letterSpacing: '-0.374px' }],
        'subheading':    ['1.3125rem', { lineHeight: '1.19', letterSpacing: '0.231px' }],
        'tile':          ['1.75rem',   { lineHeight: '1.14', letterSpacing: '0.196px' }],
        'section-head':  ['2.5rem',    { lineHeight: '1.10', letterSpacing: '-0.28px', fontWeight: '600' }],
        'display':       ['3.5rem',    { lineHeight: '1.07', letterSpacing: '-0.28px', fontWeight: '600' }],
      },
      letterSpacing: {
        'apple-body': '-0.374px',
        'apple-caption': '-0.224px',
        'apple-micro': '-0.12px',
      },
      colors: {
        'apple-blue': 'var(--apple-blue)',
        'link-blue': 'var(--link-blue)',
        'near-black': 'var(--near-black)',
        'pure-black': 'var(--pure-black)',
        'light-gray': 'var(--light-gray)',
        'dark-surface-1': 'var(--dark-surface-1)',
        border: "rgba(0,0,0,0.08)",
        input: "rgba(0,0,0,0.08)",
        ring: "#0071e3",
        background: "#ffffff",
        foreground: "#1d1d1f",
        primary: {
          DEFAULT: "#0071e3",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#f5f5f7",
          foreground: "#1d1d1f",
        },
        destructive: {
          DEFAULT: "#ff3b30",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#f5f5f7",
          foreground: "#86868b",
        },
        accent: {
          DEFAULT: "#0071e3",
          foreground: "#ffffff",
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#1d1d1f",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#1d1d1f",
        },
      },
      borderRadius: {
        micro: 'var(--radius-micro)',
        sm: 'var(--radius-sm)',
        comfortable: 'var(--radius-comfortable)',
        lg: 'var(--radius-lg)',
        pill: 'var(--radius-pill)',
        full: 'var(--radius-pill)',
      },
      boxShadow: {
        'apple': 'var(--card-shadow)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
