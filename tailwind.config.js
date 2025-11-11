/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#2c5aa0',
          600: '#1e4a8a',
          700: '#1e3a8a',
        },
        secondary: {
          500: '#34a0a4',
          600: '#2d8a8e',
        },
        accent: {
          500: '#ff6b35',
          600: '#e55a2b',
        }
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      }
    },
  },
  plugins: [],
}