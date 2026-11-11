"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Icone } from "./Icone";

/** No celular abre como gaveta que sobe da base; no computador, como janela no centro. */
export function Modal({
  aberto,
  aoFechar,
  titulo,
  children,
}: {
  aberto: boolean;
  aoFechar: () => void;
  titulo: string;
  children: React.ReactNode;
}) {
  const idTitulo = useId();
  const caixa = useRef<HTMLDivElement>(null);
  const anterior = useRef<Element | null>(null);

  useEffect(() => {
    if (!aberto) return;
    anterior.current = document.activeElement;
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && aoFechar();
    document.addEventListener("keydown", tecla);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => {
      const primeiro = caixa.current?.querySelector<HTMLElement>("[data-autofoco], input:not([type=hidden]), select, textarea, button");
      primeiro?.focus();
    });
    return () => {
      document.removeEventListener("keydown", tecla);
      document.body.style.overflow = overflow;
      (anterior.current as HTMLElement | null)?.focus?.();
    };
  }, [aberto, aoFechar]);

  if (!aberto || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-esmaecer bg-cedula-escuro/40 backdrop-blur-[2px]" onClick={aoFechar} aria-hidden />
      <div
        ref={caixa}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        className="relative flex max-h-[92dvh] w-full animate-subir flex-col rounded-t-cedula bg-white shadow-flutuante sm:max-w-xl sm:animate-surgir sm:rounded-cedula"
      >
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-linha-forte sm:hidden" aria-hidden />
        <header className="flex items-center justify-between gap-4 px-5 pb-2 pt-3 sm:px-7 sm:pt-6">
          <h2 id={idTitulo} className="text-xl font-semibold">
            {titulo}
          </h2>
          <button type="button" onClick={aoFechar} className="grid h-10 w-10 place-items-center rounded-full text-tinta-suave hover:bg-fundo" aria-label="Fechar">
            <Icone nome="fechar" />
          </button>
        </header>
        <div className="overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-7 sm:pb-7">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
