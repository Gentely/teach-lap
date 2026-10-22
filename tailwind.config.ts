import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: { 900:"#0B3C49", 800:"#0F4C5C", 700:"#14657A", 500:"#2A8FA8", 100:"#E6F2F5", 50:"#F2F9FB" },
        gold: { 500:"#E3B23C", 100:"#FBF1D6" },
        sand: "#FBF8F3"
      }
    },
  },
  plugins: [],
};
export default config;
