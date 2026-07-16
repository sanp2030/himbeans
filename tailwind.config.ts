import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        himwhite: "#F5F3EE",
        coffee: "#2B1B14",
        alpine: "#1F4D3A",
        gold: "#C8A951",
        night: "#161210",
      },
      fontFamily: {
        display: ["var(--font-playfair)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
        button: ["var(--font-poppins)", "sans-serif"],
      },
      borderRadius: { xl2: "1.25rem" },
      boxShadow: {
        soft: "0 10px 32px rgba(43,27,20,0.09)",
        lift: "0 20px 52px rgba(43,27,20,0.18)",
      },
    },
  },
  plugins: [],
} satisfies Config;
