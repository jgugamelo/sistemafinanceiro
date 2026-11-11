import Link from "next/link";
import { brl } from "@/lib/formato";

export function Cabecalho({ titulo, descricao, children }: { titulo: string; descricao?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 lg:mb-7">
      <div className="min-w-0">
        <h1 className="text-[28px] font-semibold leading-tight sm:text-[34px]">{titulo}</h1>
        {descricao && <p className="mt-1 text-[15px] text-tinta-suave">{descricao}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}

export function Painel({
  titulo,
  acao,
  className = "",
  children,
}: {
  titulo?: string;
  acao?: { rotulo: string; href: string };
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`superficie p-4 sm:p-6 ${className}`}>
      {titulo && (
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold">{titulo}</h2>
          {acao && (
            <Link href={acao.href} className="shrink-0 text-sm font-semibold text-cedula-medio hover:underline">
              {acao.rotulo}
            </Link>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

export function Chips({
  opcoes,
  atual,
  href,
  rotulo,
}: {
  opcoes: readonly { id: string; rotulo: string; extra?: string }[];
  atual: string;
  href: (id: string) => string;
  rotulo: string;
}) {
  return (
    <nav aria-label={rotulo} className="sem-barra -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
      {opcoes.map((o) => {
        const ativo = o.id === atual;
        return (
          <Link
            key={o.id}
            href={href(o.id)}
            scroll={false}
            aria-current={ativo ? "true" : undefined}
            className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors ${
              ativo ? "border-cedula bg-cedula text-white" : "border-linha-forte bg-white text-tinta-suave hover:border-tinta-fraca hover:text-tinta"
            }`}
          >
            {o.rotulo}
            {o.extra && <span className={`valor text-xs ${ativo ? "text-white/70" : "text-tinta-fraca"}`}>{o.extra}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

/** Lista com barra proporcional: no celular lê melhor que uma tabela larga. */
export function Barras({
  itens,
  cor = "bg-saida",
  vazio = "Nada neste período.",
}: {
  itens: { nome: string; valor: number; detalhe?: string }[];
  cor?: string;
  vazio?: string;
}) {
  if (!itens.length) return <p className="py-8 text-center text-sm text-tinta-fraca">{vazio}</p>;
  const maior = Math.max(...itens.map((i) => Math.abs(i.valor)), 1);
  return (
    <ul className="flex flex-col gap-3.5">
      {itens.map((item, i) => (
        <li key={item.nome}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium">{item.nome}</span>
            <span className="valor shrink-0 font-semibold">{brl(item.valor)}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-fundo">
              <div
                className={`h-full origin-left animate-crescer rounded-full ${cor}`}
                style={{ width: `${Math.max((Math.abs(item.valor) / maior) * 100, 1.5)}%`, animationDelay: `${i * 60}ms` }}
              />
            </div>
            {item.detalhe && <span className="valor w-12 shrink-0 text-right text-xs text-tinta-fraca">{item.detalhe}</span>}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Vazio({ titulo, children }: { titulo: string; children?: React.ReactNode }) {
  return (
    <div className="px-4 py-12 text-center">
      <p className="font-titulo text-lg font-semibold">{titulo}</p>
      {children && <div className="mx-auto mt-1.5 max-w-sm text-sm text-tinta-suave">{children}</div>}
    </div>
  );
}

export function SemDados() {
  return (
    <div className="superficie p-6 text-sm leading-relaxed">
      <h2 className="text-lg font-semibold">Ainda não há dados</h2>
      <p className="mt-2 text-tinta-suave">
        Confira se as variáveis do Supabase estão configuradas, ou rode <code className="rounded bg-fundo px-1.5 py-0.5">npm run importar</code> para
        carregar o backup. O passo a passo está no README.
      </p>
    </div>
  );
}

/** Selo com a data de vencimento: vermelho se venceu, âmbar se vence hoje. */
export function SeloData({ dias, data }: { dias: number; data: string }) {
  const [, m, d] = data.split("-");
  const tom = dias < 0 ? "bg-saida-claro text-saida" : dias === 0 ? "bg-alerta-claro text-alerta" : "bg-fundo text-tinta-suave";
  return (
    <span className={`flex w-[58px] shrink-0 flex-col items-center rounded-xl py-1.5 leading-none ${tom}`}>
      <span className="valor text-[15px] font-bold">{d}/{m}</span>
      <span className="mt-1 text-[10px] font-semibold">{dias < 0 ? `há ${-dias} d` : dias === 0 ? "hoje" : `em ${dias} d`}</span>
    </span>
  );
}
