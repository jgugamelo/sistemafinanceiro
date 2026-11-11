"use client";

import { useEffect, useState } from "react";
import { Icone } from "./Icone";

const EVENTO = "financeiro:aviso";

/** Mostra uma confirmação curta no rodapé da tela ("Despesa registrada"). */
export function avisar(texto: string, tom: "ok" | "erro" = "ok") {
  window.dispatchEvent(new CustomEvent(EVENTO, { detail: { texto, tom } }));
}

export function Avisos() {
  const [avisos, setAvisos] = useState<{ id: number; texto: string; tom: "ok" | "erro" }[]>([]);

  useEffect(() => {
    const ouvir = (e: Event) => {
      const { texto, tom } = (e as CustomEvent).detail;
      const id = Date.now() + Math.random();
      setAvisos((a) => [...a.slice(-2), { id, texto, tom }]);
      setTimeout(() => setAvisos((a) => a.filter((x) => x.id !== id)), 4200);
    };
    window.addEventListener(EVENTO, ouvir);
    return () => window.removeEventListener(EVENTO, ouvir);
  }, []);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:left-[248px]"
    >
      {avisos.map((a) => (
        <div
          key={a.id}
          role="status"
          className={`flex animate-aviso items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-semibold shadow-flutuante ${
            a.tom === "ok" ? "bg-cedula-escuro text-white" : "bg-saida text-white"
          }`}
        >
          <Icone nome={a.tom === "ok" ? "check" : "fechar"} className="h-4 w-4" />
          {a.texto}
        </div>
      ))}
    </div>
  );
}
