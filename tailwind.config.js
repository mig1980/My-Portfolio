/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
    "!./node_modules/**",
  ],
  // Theme is defined in styles/globals.css using @theme directive (Tailwind v4)
  theme: {},
  plugins: [],
}
