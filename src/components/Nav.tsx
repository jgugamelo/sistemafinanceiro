"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ICONES: Record<string, string> = {
  painel: "M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z",
  relatorios: "M5 20V10m7 10V4m7 16v-7",
  lancamentos: "M4 7h16M4 12h16M4 17h10",
  contas: "M7 3v4m10-4v4M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z",
  cadastros: "M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1m17 0v-1a4 4 0 0 0-3-3.9M13 4.1a4 4 0 0 1 0 7.8M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
};

const ITENS = [
  { href: "/", id: "painel", rotulo: "Painel", pronto: true },
  { href: "/relatorios", id: "relatorios", rotulo: "Relatórios", pronto: true },
  { href: "#", id: "lancamentos", rotulo: "Lançamentos", pronto: false },
  { href: "#", id: "contas", rotulo: "Pagar e receber", pronto: false },
  { href: "#", id: "cadastros", rotulo: "Cadastros", pronto: false },
];

function Icone({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={ICONES[id]} />
    </svg>
  );
}

export function Nav() {
  const caminho = usePathname();
  const ativo = (href: string) => (href === "/" ? caminho === "/" : caminho.startsWith(href));

  return (
    <>
      {/* Computador: barra lateral */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col bg-tinta px-4 py-6 text-white lg:flex">
        <div className="mb-8 flex items-center gap-2 px-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-marca font-titulo text-sm font-bold">F</span>
          <span className="font-titulo text-lg font-semibold">Financeiro</span>
        </div>
        <nav className="flex flex-col gap-1" aria-label="Seções">
          {ITENS.map((item) =>
            item.pronto ? (
              <Link
                key={item.id}
                href={item.href}
                aria-current={ativo(item.href) ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  ativo(item.href) ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icone id={item.id} />
                {item.rotulo}
              </Link>
            ) : (
              <span key={item.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/30">
                <Icone id={item.id} />
                {item.rotulo}
                <span className="ml-auto whitespace-nowrap rounded-full border border-white/15 px-1.5 py-0.5 text-[9px] uppercase tracking-wide">em breve</span>
              </span>
            ),
          )}
        </nav>
      </aside>

      {/* Celular: barra inferior */}
      <nav
        aria-label="Seções"
        className="fixed inset-x-0 bottom-0 z-20 flex border-t border-linha bg-white/95 backdrop-blur lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {ITENS.filter((i) => i.pronto).map((item) => (
          <Link
            key={item.id}
            href={item.href}
            aria-current={ativo(item.href) ? "page" : undefined}
            className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
              ativo(item.href) ? "text-marca" : "text-tinta/50"
            }`}
          >
            <Icone id={item.id} />
            {item.rotulo}
          </Link>
        ))}
      </nav>
    </>
  );
}
