const CAMINHOS = {
  painel: "M3.5 12.5 12 4l8.5 8.5M6 10v9.5h4.5V15h3v4.5H18V10",
  lancamentos: "M5 6.5h14M5 12h14M5 17.5h9",
  contas: "M7 3.5v3m10-3v3M4 9.5h16M5.5 5.5h13a1.5 1.5 0 0 1 1.5 1.5v11.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5V7a1.5 1.5 0 0 1 1.5-1.5ZM8 13.5h3",
  relatorios: "M5 20V11m7 9V4.5m7 15.5v-6.5",
  cadastros: "M15.5 19.5v-1a3.5 3.5 0 0 0-3.5-3.5H7a3.5 3.5 0 0 0-3.5 3.5v1M19.5 19.5v-1a3.5 3.5 0 0 0-2.6-3.4M14.5 4.6a3.5 3.5 0 0 1 0 6.8M9.5 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z",
  mais: "M12 5v14M5 12h14",
  fechar: "M6 6l12 12M18 6 6 18",
  olho: "M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12Zm9.5 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  olhoFechado: "M3 3l18 18M10.6 5.6A10 10 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.7 3.4M6.6 6.7C3.9 8.4 2.5 12 2.5 12s3.5 6.5 9.5 6.5c1.6 0 3-.4 4.3-1M9.9 9.9a3 3 0 0 0 4.2 4.2",
  ajustes: "M4 7h10m4 0h2M4 17h2m4 0h10M14 4.5v5M8 14.5v5",
  busca: "M10.5 17.5a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4.5-4.5",
  entrada: "M12 19V5m0 0-6 6m6-6 6 6",
  saida: "M12 5v14m0 0 6-6m-6 6-6-6",
  transferencia: "M4 8h14m0 0-3.5-3.5M18 8l-3.5 3.5M20 16H6m0 0 3.5-3.5M6 16l3.5 3.5",
  check: "M5 12.5 10 17.5 19.5 7",
  lixeira: "M4.5 7h15M9.5 7V5h5v2M6.5 7l1 12.5h9l1-12.5",
  seta: "M9 6l6 6-6 6",
  sair: "M14 4.5h4.5v15H14M10 8l-4 4 4 4M6 12h10",
} as const;

export type NomeIcone = keyof typeof CAMINHOS;

export function Icone({ nome, className = "h-5 w-5" }: { nome: NomeIcone; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={CAMINHOS[nome]} />
    </svg>
  );
}
