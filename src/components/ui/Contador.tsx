"use client";

import { useEffect, useRef, useState } from "react";
import { brl } from "@/lib/formato";

/** Valor em reais que corre até o número novo quando ele muda. */
export function Contador({ valor, oculto = false, duracao = 900 }: { valor: number; oculto?: boolean; duracao?: number }) {
  const [mostrado, setMostrado] = useState(valor);
  const atual = useRef(0);
  const primeira = useRef(true);

  useEffect(() => {
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const de = primeira.current ? 0 : atual.current;
    primeira.current = false;
    if (reduzido) {
      atual.current = valor;
      setMostrado(valor);
      return;
    }
    const inicio = performance.now();
    let quadro = 0;
    const passo = (agora: number) => {
      const t = Math.min((agora - inicio) / duracao, 1);
      const suave = 1 - Math.pow(1 - t, 4);
      const v = de + (valor - de) * suave;
      atual.current = v;
      setMostrado(v);
      if (t < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [valor, duracao]);

  if (oculto) return <span aria-label="Valor oculto">R$ ••••••</span>;
  return (
    <span className="valor" aria-label={brl(valor)}>
      {brl(mostrado)}
    </span>
  );
}
