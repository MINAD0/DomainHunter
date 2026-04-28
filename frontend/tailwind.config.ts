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
        navy: "#10233f",
        ink: "#1f2937",
        surface: "#ffffff",
        mist: "#f3f6f8",
        accent: "#17a673",
        blue: "#2563eb"
      },
      boxShadow: {
        soft: "0 14px 40px rgba(16, 35, 63, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;

