"use client";

import { useEffect, useState } from "react";

/** true quando a pessoa pediu menos animação no sistema. */
export function useMovimentoReduzido() {
  const [reduzido, setReduzido] = useState(false);
  useEffect(() => {
    const consulta = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduzido(consulta.matches);
    const mudar = () => setReduzido(consulta.matches);
    consulta.addEventListener("change", mudar);
    return () => consulta.removeEventListener("change", mudar);
  }, []);
  return reduzido;
}
