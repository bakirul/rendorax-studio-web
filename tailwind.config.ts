import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          body: "#050505",
          panel: "#0a0a0a",
        },
        text: {
          white: "#e0e0e0",
          gray: "#9ca3af",
        },
        gold: {
          primary: "#d4af37",
          muted: "#8a701e",
          line: "rgba(212, 175, 55, 0.15)",
        },
      },
      fontFamily: {
        main: ["var(--font-manrope)", "sans-serif"],
        display: ["var(--font-playfair)", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
