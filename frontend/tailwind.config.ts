import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        navy: "#101720",
        ink: "#16202b",
        surface: "#ffffff",
        mist: "#edf3f7",
        accent: "#22d3a6",
        blue: "#0ea5e9",
        carbon: "#090d12",
        graphite: "#131b24",
        circuit: "#7c3aed",
        signal: "#f7c948"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(9, 13, 18, 0.12)",
        glow: "0 0 0 1px rgba(14, 165, 233, 0.18), 0 18px 55px rgba(14, 165, 233, 0.14)"
      }
    }
  },
  plugins: []
};

export default config;
