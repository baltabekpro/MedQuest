/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        background: '#F8FAFC',
        sidebar: '#FFFFFF',
        border: '#E2E8F0',
        text: '#0F172A',
        muted: '#64748B',
      },
      borderRadius: {
        lg: '0.5rem',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
