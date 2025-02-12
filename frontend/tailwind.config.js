/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          dark: '#22223B',
          light: '#F2E9E4',
        },
        secondary: {
          dark: '#4A4E69',
          light: '#C9ADA7',
        },
        tertiary: '#9A8C98',
      },
      fontFamily: {
        sans: ['Inter var', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}