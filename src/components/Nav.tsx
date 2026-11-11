"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icone, type NomeIcone } from "./ui/Icone";

const ITENS: { href: string; icone: NomeIcone; rotulo: string; curto: string }[] = [
  { href: "/", icone: "painel", rotulo: "Painel", curto: "Painel" },
  { href: "/lancamentos", icone: "lancamentos", rotulo: "Lançamentos", curto: "Lançamentos" },
  { href: "/contas", icone: "contas", rotulo: "Pagar e receber", curto: "Contas" },
  { href: "/relatorios", icone: "relatorios", rotulo: "Relatórios", curto: "Relatórios" },
  { href: "/cadastros", icone: "cadastros", rotulo: "Cadastros", curto: "Cadastros" },
];

function Marca() {
  return (
    <svg viewBox="0 0 32 32" className="h-9 w-9" aria-hidden>
      <rect width="32" height="32" rx="9" fill="#0F3D2F" />
      <path d="M6 20c3-5 6-5 10 0s7 5 10 0M6 14c3-5 6-5 10 0s7 5 10 0" fill="none" stroke="#E9D7A6" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function Nav() {
  const caminho = usePathname();
  const ativo = (href: string) => (href === "/" ? caminho === "/" : caminho.startsWith(href));

  return (
    <>
      {/* Computador: barra lateral clara; o verde fica reservado para o cartão de saldo */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[248px] flex-col border-r border-linha bg-white/70 px-4 py-6 backdrop-blur lg:flex">
        <Link href="/" className="mb-9 flex items-center gap-3 px-2">
          <Marca />
          <span className="font-titulo text-[19px] font-semibold tracking-tight">Financeiro</span>
        </Link>
        <nav className="flex flex-col gap-1" aria-label="Seções">
          {ITENS.map((item) => {
            const atual = ativo(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={atual ? "page" : undefined}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold transition-colors ${
                  atual ? "bg-cedula-claro text-cedula" : "text-tinta-suave hover:bg-fundo hover:text-tinta"
                }`}
              >
                <span className={`absolute -left-4 top-2 bottom-2 w-1 rounded-r-full transition-colors ${atual ? "bg-cedula" : "bg-transparent"}`} aria-hidden />
                <Icone nome={item.icone} />
                {item.rotulo}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Celular: barra inferior */}
      <nav
        aria-label="Seções"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-linha bg-white/90 backdrop-blur-lg lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {ITENS.map((item) => {
          const atual = ativo(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={atual ? "page" : undefined}
              className={`flex min-h-[62px] flex-col items-center justify-center gap-1 text-[11px] font-semibold ${atual ? "text-cedula" : "text-tinta-fraca"}`}
            >
              <span className={`grid h-7 w-12 place-items-center rounded-full transition-colors ${atual ? "bg-cedula-claro" : ""}`}>
                <Icone nome={item.icone} />
              </span>
              {item.curto}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
