/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#0f172a',
          900: '#1e293b',
          800: '#334155',
          700: '#475569',
          600: '#64748b',
          400: '#94a3b8',
          300: '#cbd5e1',
        },
        orange: {
          500: '#ff6b35',
          600: '#ff5722',
          400: '#ff8a50',
        },
      },
      spacing: {
        sidebar: '16rem',
        'sidebar-collapsed': '5rem',
      },
    },
  },
  plugins: [],
}

