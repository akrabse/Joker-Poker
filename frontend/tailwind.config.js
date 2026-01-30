/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        poker: {
          green: '#0a5f38',
          darkGreen: '#064230',
          felt: '#1a7a4e',
          dark: '#0f0f0f',
          darker: '#050505',
          light: '#1a1a1a',
          gold: '#ffd700',
          red: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
