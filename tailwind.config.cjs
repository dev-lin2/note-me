/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          light: "#ffffff",
          dark: "#0b0b0c",
        },
      },
    },
  },
  plugins: [],
}
