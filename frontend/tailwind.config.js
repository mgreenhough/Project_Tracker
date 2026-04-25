/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          blue: '#00f3ff',
          green: '#39ff14',
          pink: '#ff00ff',
          orange: '#ff9e00',
          red: '#ff3333',
        },
      },
    },
  },
  plugins: [],
}
