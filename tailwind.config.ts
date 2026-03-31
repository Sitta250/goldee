import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50:  '#fdf8ec',
          100: '#fbf0cf',
          200: '#f6de9a',
          300: '#f0c55b',
          400: '#e9ac2d',
          500: '#d4911a',
          600: '#b07213',
          700: '#8a5512',
          800: '#714215',
          900: '#603716',
        },
      },
      fontFamily: {
        sans: ['var(--font-sarabun)', 'Sarabun', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Large price display sizes
        'price-sm': ['1.75rem', { lineHeight: '1.2', fontWeight: '700' }],
        'price-md': ['2.25rem', { lineHeight: '1.15', fontWeight: '700' }],
        'price-lg': ['2.75rem', { lineHeight: '1.1',  fontWeight: '700' }],
      },
      spacing: {
        'section': '4rem',
      },
      borderRadius: {
        'card': '0.75rem',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.10)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}

export default config
