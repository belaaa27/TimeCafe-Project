/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./admin/**/*.html",
    "./js/**/*.js",
    "./admin/js/**/*.js",
  ],

  // Guarantees dynamically generated status badge styles are included in css/output.css
  safelist: [
    {
      pattern:
        /(bg|text|border)-(emerald|amber|blue|rose|indigo|slate|sky|gray)-(50|100|200|500|600|700|800)/,
    },
  ],

  theme: {
    extend: {
      colors: {
        // Full Primary Red Shade Scale
        primary: {
          DEFAULT: "#E53935",
          50: "#FFEBEE",
          100: "#FFCDD2",
          200: "#EF9A9A",
          300: "#E57373",
          400: "#EF5350",
          500: "#E53935",
          600: "#D32F2F",
          700: "#C62828",
          dark: "#C62828",
        },
        primaryDark: "#C62828",
        secondary: "#F59E0B",
        accent: "#F59E0B",
        dark: "#111827",
        light: "#F9FAFB",

        // Chapa Brand Green Theme
        chapa: "#00C48C",
        chapaDark: "#00A374",

        // Admin Dashboard Colors
        slateDark: "#0f172a",
        slatePanel: "#1e293b",
        slateBg: "#f8fafc",
        adminAccent: "#2563eb",
        adminAccentHover: "#1d4ed8",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        serif: ["Playfair Display", "serif"],
        heading: ["Playfair Display", "serif"],
      },
      boxShadow: {
        "3d": "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        "3d-hover":
          "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
        "3d-btn": "0 4px 0 0 #C62828",
        "chapa-btn": "0 4px 14px 0 rgba(0, 196, 140, 0.39)",
        "inner-light": "inset 0 2px 4px 0 rgba(255, 255, 255, 0.3)",
        floating: "0 25px 35px -10px rgba(0, 0, 0, 0.15)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-15px)" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "0.6" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out 2s infinite",
        "pulse-slow": "pulse-slow 4s ease-in-out infinite",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
