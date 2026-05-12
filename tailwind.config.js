/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1A6B3C',
          light: '#22A85A',
          dark: '#115228',
        },
        accent: '#C8102E',
        gold: '#F5A623',
        surface: '#1A1A1A',
        card: '#242424',
        border: '#2E2E2E',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
      screens: {
        xs: '375px',
      },
    },
  },
  plugins: [],
};
