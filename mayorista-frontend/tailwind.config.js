/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'mayorista-red': '#ef1d26',
        'mayorista-white': '#ffffff',
        'mayorista-surface': '#f8f9fa',
        'mayorista-text-primary': '#1a1a1a',
        'mayorista-text-secondary': '#6c757d',
        // New design tokens
        'primary': '#EF233C',
        'primary-hover': '#D61B16',
        'secondary': '#2B2D42',
        'background-light': '#F3F4F6',
        'background-dark': '#0F172A',
        'surface-light': '#FFFFFF',
        'surface-dark': '#1E293B',
        'border-light': '#E5E7EB',
        'border-dark': '#334155',
        'sidebar-dark': '#2D3436',
        'sidebar-hover': '#3D4548',
        'text-main': '#111827',
        'text-muted': '#6B7280',
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

