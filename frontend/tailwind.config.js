/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          850: '#17253f',
          350: '#a4b5cd',
          250: '#d3def0',
        },
        gray: {
          650: '#4b5563',
          655: '#4b5563',
          850: '#1f2937',
        },
        yellow: {
          755: '#b45309',
        }
      }
    },
  },
  plugins: [],
}