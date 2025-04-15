/** @type {import('tailwindcss').Config} */
const config = {
  theme: {
    extend: {
      keyframes: {
        "fade-in": {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        "zoom-in": {
          "0%": { transform: "scale(0.95)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "zoom-in": "zoom-in 0.2s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
