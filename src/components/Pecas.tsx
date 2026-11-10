import Link from "next/link";
import { brl } from "@/lib/formato";

export function Kpi({
  rotulo,
  valor,
  detalhe,
  tom = "neutro",
  href,
}: {
  rotulo: string;
  valor: number;
  detalhe?: string;
  tom?: "neutro" | "entrada" | "saida" | "alerta";
  href?: string;
}) {
  const cor = { neutro: "text-tinta", entrada: "text-entrada", saida: "text-saida", alerta: "text-alerta" }[tom];
  const corpo = (
    <>
      <p className="text-xs font-medium text-tinta/60">{rotulo}</p>
      <p className={`numero mt-1 text-lg font-semibold leading-tight sm:text-2xl ${cor}`}>{brl(valor)}</p>
      {detalhe && <p className="mt-1 text-xs text-tinta/50">{detalhe}</p>}
    </>
  );
  const classe = "cartao block p-4";
  return href ? (
    <Link href={href} className={`${classe} transition-shadow hover:shadow-md`}>
      {corpo}
    </Link>
  ) : (
    <div className={classe}>{corpo}</div>
  );
}

export function Secao({
  titulo,
  acao,
  children,
}: {
  titulo: string;
  acao?: { rotulo: string; href: string };
  children: React.ReactNode;
}) {
  return (
    <section className="cartao p-4 sm:p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-titulo text-base font-semibold">{titulo}</h2>
        {acao && (
          <Link href={acao.href} className="shrink-0 text-sm font-medium text-marca hover:underline">
            {acao.rotulo}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/** Lista com barra proporcional: lê bem no celular, onde uma tabela larga não cabe. */
export function Barras({
  itens,
  cor = "bg-saida",
  vazio = "Nada neste período.",
}: {
  itens: { nome: string; valor: number; detalhe?: string }[];
  cor?: string;
  vazio?: string;
}) {
  if (!itens.length) return <p className="py-6 text-center text-sm text-tinta/50">{vazio}</p>;
  const maior = Math.max(...itens.map((i) => Math.abs(i.valor)), 1);
  return (
    <ul className="flex flex-col gap-3">
      {itens.map((item) => (
        <li key={item.nome}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">{item.nome}</span>
            <span className="numero shrink-0 font-medium">{brl(item.valor)}</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-tinta/5">
              <div className={`h-full rounded-full ${cor}`} style={{ width: `${Math.max((Math.abs(item.valor) / maior) * 100, 1.5)}%` }} />
            </div>
            {item.detalhe && <span className="w-12 shrink-0 text-right text-xs text-tinta/50">{item.detalhe}</span>}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Chips({
  opcoes,
  atual,
  href,
  rotulo,
}: {
  opcoes: readonly { id: string; rotulo: string }[];
  atual: string;
  href: (id: string) => string;
  rotulo: string;
}) {
  return (
    <nav aria-label={rotulo} className="sem-barra -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
      {opcoes.map((o) => (
        <Link
          key={o.id}
          href={href(o.id)}
          scroll={false}
          aria-current={o.id === atual ? "true" : undefined}
          className={`shrink-0 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
            o.id === atual ? "border-tinta bg-tinta text-white" : "border-linha bg-white text-tinta/70 hover:border-tinta/40"
          }`}
        >
          {o.rotulo}
        </Link>
      ))}
    </nav>
  );
}

export function SemDados() {
  return (
    <div className="cartao p-6 text-sm leading-relaxed">
      <h2 className="font-titulo text-base font-semibold">Ainda não há dados</h2>
      <p className="mt-2 text-tinta/70">
        Rode <code className="rounded bg-tinta/5 px-1.5 py-0.5">npm run importar</code> apontando para a pasta do backup, ou
        configure a planilha Google. O passo a passo está no README.
      </p>
    </div>
  );
}
