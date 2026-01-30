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
        'light-canvas': '#FDF8F1',
        'light-card': '#FFFFFF',
        'light-border': '#2D1B14',
        'dark-canvas': '#0D0D0D',
        'dark-card': '#1A1A1A',
      },
      borderRadius: {
        '4xl': '3rem', // 48px
      },
      fontFamily: {
        sans: ['"Bricolage Grotesque"', 'sans-serif'],
        script: ['"Patrick Hand"', 'cursive'],
      },
    },
  },
  plugins: [],
}
