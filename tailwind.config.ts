import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        fitto: {
          bg: "#F7F4ED",
          card: "#F1ECE3",
          text: "#2F2A25",
          muted: "#8A8178",
          accent: "#6F7D5A",
          "accent-hover": "#5E6B4C",
        },
      },
      keyframes: {
        "blob-float-1": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(30px, -20px) scale(1.1)" },
          "66%": { transform: "translate(-15px, 15px) scale(0.95)" },
        },
        "blob-float-2": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(-20px, 25px) scale(1.05)" },
          "66%": { transform: "translate(25px, -10px) scale(0.9)" },
        },
        "blob-float-3": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(15px, 20px) scale(0.95)" },
          "66%": { transform: "translate(-25px, -15px) scale(1.1)" },
        },
        "flame-breathe": {
          "0%, 100%": { transform: "translateY(0) scale(1)", opacity: "0.85" },
          "50%": { transform: "translateY(-2px) scale(1.1)", opacity: "1" },
        },
        "flame-glow": {
          "0%, 100%": { opacity: "0.3", transform: "scale(0.95)" },
          "50%": { opacity: "0.55", transform: "scale(1.15)" },
        },
      },
      animation: {
        "blob-1": "blob-float-1 22s ease-in-out infinite",
        "blob-2": "blob-float-2 26s ease-in-out infinite",
        "blob-3": "blob-float-3 18s ease-in-out infinite",
        "flame-breathe": "flame-breathe 2.8s ease-in-out infinite",
        "flame-glow": "flame-glow 2.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
