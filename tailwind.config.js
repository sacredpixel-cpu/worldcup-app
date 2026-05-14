/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#E91E8C',   // Mexillicious hot pink
          light: '#F048A8',
          dark: '#C4157A',
        },
        accent: '#2D9E35',      // Mexillicious green
        gold: '#F5A623',
        surface: '#F2EEEB',     // light warm surface
        card: '#FFFFFF',        // white cards
        border: '#E2DDD8',      // soft warm border
        muted: '#7A746E',       // muted text
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
