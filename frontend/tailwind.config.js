/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          orange: "#F47B20",
          "orange-hover": "#D96A15",
          "orange-light": "#FEF3E8",
        },
      },
    },
  },
  plugins: [],
};
