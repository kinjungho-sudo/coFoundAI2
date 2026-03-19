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
        background: "#0F0E17",
        surface: "#1A1927",
        border: "#2D2B42",
        cofounder: "#534AB7",
        devil: "#E24B4A",
        success: "#1D9E75",
        score: {
          red: "#E24B4A",
          yellow: "#F5A623",
          green: "#1D9E75",
          blue: "#4A90D9",
        },
      },
      fontFamily: {
        sans: ["Pretendard", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
