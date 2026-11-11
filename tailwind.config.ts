import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cedula: { DEFAULT: "#0F3D2F", escuro: "#0A2A20", medio: "#1D5A46", claro: "#DCEBE2", nevoa: "#EEF5F0" },
        tinta: { DEFAULT: "#10201A", suave: "#4A5C54", fraca: "#7D8C85" },
        fundo: "#EEF2EE",
        linha: { DEFAULT: "#DCE3DD", forte: "#C5D0C8" },
        entrada: { DEFAULT: "#1F7A52", claro: "#E2F2E9" },
        saida: { DEFAULT: "#B42318", claro: "#FBE9E7" },
        alerta: { DEFAULT: "#A16207", claro: "#FBF1DC" },
        latao: { DEFAULT: "#B8913A", claro: "#E9D7A6" },
      },
      fontFamily: {
        sans: ["'Manrope Variable'", "system-ui", "sans-serif"],
        titulo: ["'Bricolage Grotesque Variable'", "'Manrope Variable'", "system-ui", "sans-serif"],
      },
      borderRadius: { cedula: "1.75rem" },
      boxShadow: {
        superficie: "0 1px 0 rgba(16,32,26,.04), 0 1px 2px rgba(16,32,26,.06)",
        flutuante: "0 12px 40px -12px rgba(10,42,32,.35), 0 2px 6px rgba(10,42,32,.08)",
      },
      keyframes: {
        subir: { from: { transform: "translateY(100%)" }, to: { transform: "translateY(0)" } },
        surgir: { from: { opacity: "0", transform: "translateY(8px) scale(.98)" }, to: { opacity: "1", transform: "none" } },
        esmaecer: { from: { opacity: "0" }, to: { opacity: "1" } },
        aviso: { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "none" } },
        crescer: { from: { transform: "scaleX(0)" }, to: { transform: "scaleX(1)" } },
      },
      animation: {
        subir: "subir .32s cubic-bezier(.2,.8,.2,1)",
        surgir: "surgir .22s cubic-bezier(.2,.8,.2,1)",
        esmaecer: "esmaecer .2s ease-out",
        aviso: "aviso .28s cubic-bezier(.2,.8,.2,1)",
        crescer: "crescer .9s cubic-bezier(.2,.8,.2,1) both",
      },
    },
  },
  plugins: [],
} satisfies Config;
