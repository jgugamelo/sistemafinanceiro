import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        tinta: "#16202e",
        papel: "#f6f4ef",
        linha: "#e4e0d6",
        marca: { DEFAULT: "#0f6b54", claro: "#e3f1ec", escuro: "#0a4a3a" },
        entrada: "#0f7a5c",
        saida: "#c2412d",
        alerta: "#b7791f",
      },
      fontFamily: {
        sans: ["var(--font-texto)", "system-ui", "sans-serif"],
        titulo: ["var(--font-titulo)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
