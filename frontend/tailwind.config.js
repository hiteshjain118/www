/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coral: {
          50: '#fef7f6',
          100: '#fdeeea',
          200: '#fbdcd4',
          300: '#f7c2b4',
          400: '#f19d85',
          500: '#ea7a5a',
          600: '#e15a3a',
          700: '#c94a2e',
          800: '#a53d2a',
          900: '#863527',
        },
        brick: {
          50: '#fdf4f4',
          100: '#fbe8e8',
          200: '#f5d5d5',
          300: '#eeb4b4',
          400: '#e48585',
          500: '#d65a5a',
          600: '#c23d3d',
          700: '#a32e2e',
          800: '#872929',
          900: '#722727',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} 