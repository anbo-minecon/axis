import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "axis-azul": "#1e5ab1",
        "axis-azul-dark": "#0d3d7a",
        brand: {
          50:  "#eef4ff",
          100: "#d9e7ff",
          200: "#bcd2ff",
          300: "#8eb4ff",
          400: "#5a8eff",
          500: "#2563eb",  // azul principal
          600: "#1d4ed8",
          700: "#1e40af",
          800: "#1e3a8a",
          900: "#1e3461",
        },
        gold: {
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      animation: {
        "fade-up":    "fadeUp 0.6s ease forwards",
        "fade-in":    "fadeIn 0.8s ease forwards",
        "slide-left": "slideLeft 0.6s ease forwards",
        "float":      "float 3s ease-in-out infinite",
        "pulse-slow": "pulse 4s ease-in-out infinite",
        "glow":       "glow 2s ease-in-out infinite alternate",
        "counter":    "counter 2s ease-out forwards",
        "draw":       "draw 2s ease forwards",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideLeft: {
          "0%":   { opacity: "0", transform: "translateX(30px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-12px)" },
        },
        glow: {
          "0%":   { boxShadow: "0 0 20px rgba(37,99,235,0.3)" },
          "100%": { boxShadow: "0 0 40px rgba(37,99,235,0.7)" },
        },
        draw: {
          "0%":   { strokeDashoffset: "1000" },
          "100%": { strokeDashoffset: "0" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
