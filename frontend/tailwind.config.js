/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f4f6f8",
          100: "#e5e9ee",
          200: "#c7cfd9",
          400: "#7c8aa0",
          600: "#3d4a5f",
          700: "#2a3648",
          800: "#1b2433",
          900: "#101724",
          950: "#0a0f18",
        },
        brand: {
          50: "#fdf1ec",
          100: "#fbe0d3",
          400: "#f2946a",
          500: "#ec7c4b",
          600: "#d9612f",
          700: "#b34a20",
        },
        signal: {
          500: "#2f6f5e",
          600: "#26594b",
        },
        amber: {
          500: "#b9772f",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 2px rgba(16, 23, 36, 0.06), 0 8px 24px rgba(16, 23, 36, 0.06)",
      },
    },
  },
  plugins: [],
};