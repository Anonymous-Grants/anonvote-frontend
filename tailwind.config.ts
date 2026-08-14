import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./hooks/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b0c10",
        paper: "#fafafa",
        accent: "#5b5bd6",
        accentSoft: "#eceafd",
      },
    },
  },
  plugins: [],
};

export default config;
