import Link from "next/link";
import { Cabecalho, Chips, SeloData, SemDados, Vazio } from "@/components/ui/Partes";
import { agrupar, intervalo, PERIODOS, porVencimento, type Dimensao } from "@/lib/calculos";
import { dados } from "@/lib/dados";
import { brl, dataBr, diasEntre, hojeIso, percentual } from "@/lib/formato";

export const dynamic = "force-dynamic";
export const metadata = { title: "Relatórios" };

const TIPOS = [
  { id: "pessoa", rotulo: "Por cliente e fornecedor" },
  { id: "centro", rotulo: "Por centro de custo" },
  { id: "plano", rotulo: "Por plano de contas" },
  { id: "vencimentos", rotulo: "Contas por vencimento" },
] as const;

const NATUREZAS = [
  { id: "despesas", rotulo: "Despesas" },
  { id: "receitas", rotulo: "Receitas" },
] as const;

const LADOS = [
  { id: "pagar", rotulo: "A pagar" },
  { id: "receber", rotulo: "A receber" },
] as const;

type Busca = { tipo?: string; periodo?: string; natureza?: string; lado?: string };

export default async function Relatorios({ searchParams }: { searchParams: Busca }) {
  const tipo = TIPOS.find((t) => t.id === searchParams.tipo)?.id ?? "pessoa";
  const natureza = searchParams.natureza === "receitas" ? "receitas" : "despesas";
  const lado = searchParams.lado === "receber" ? "receber" : "pagar";
  const hoje = hojeIso();
  const periodo = intervalo(searchParams.periodo, hoje);

  const link = (mudanca: Busca) => {
    const p = new URLSearchParams({ tipo, periodo: periodo.id, natureza, lado, ...(mudanca as Record<string, string>) });
    return `/relatorios?${p.toString()}`;
  };

  return (
    <>
      <Cabecalho titulo="Relatórios" />
      <div className="mb-5 flex flex-col gap-2">
        <Chips rotulo="Relatório" opcoes={TIPOS} atual={tipo} href={(id) => link({ tipo: id })} />
        {tipo === "vencimentos" ? (
          <Chips rotulo="Lado" opcoes={LADOS} atual={lado} href={(id) => link({ lado: id })} />
        ) : (
          <>
            <Chips rotulo="Natureza" opcoes={NATUREZAS} atual={natureza} href={(id) => link({ natureza: id })} />
            <Chips rotulo="Período" opcoes={PERIODOS} atual={periodo.id} href={(id) => link({ periodo: id })} />
          </>
        )}
      </div>
      {tipo === "vencimentos" ? (
        <Vencimentos lado={lado} hoje={hoje} />
      ) : (
        <Agrupado dimensao={tipo} natureza={natureza} de={periodo.de} ate={periodo.ate} rotuloPeriodo={periodo.rotulo} />
      )}
    </>
  );
}

const NOMES_DIMENSAO: Record<string, string> = { pessoa: "clientes e fornecedores", centro: "centros de custo", plano: "planos de contas" };

async function Agrupado({
  dimensao,
  natureza,
  de,
  ate,
  rotuloPeriodo,
}: {
  dimensao: Dimensao;
  natureza: "receitas" | "despesas";
  de: string;
  ate: string;
  rotuloPeriodo: string;
}) {
  const lancamentos = await dados.lancamentos();
  if (!lancamentos.length) return <SemDados />;

  const linhas = agrupar(lancamentos, dimensao, de, ate)
    .filter((g) => g[natureza] > 0)
    .sort((a, b) => b[natureza] - a[natureza]);
  const total = linhas.reduce((s, g) => s + g[natureza], 0);
  const maior = linhas[0]?.[natureza] ?? 1;
  const cinco = linhas.slice(0, 5).reduce((s, g) => s + g[natureza], 0);
  const receita = natureza === "receitas";

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <aside className="flex flex-col gap-4 xl:order-2 xl:sticky xl:top-8 xl:self-start">
        <section className="superficie p-5">
          <p className="text-sm font-semibold text-tinta-suave">
            {receita ? "Receitas" : "Despesas"}, {rotuloPeriodo.toLowerCase()}
          </p>
          <p className={`valor mt-1 font-titulo text-[30px] font-semibold leading-tight ${receita ? "text-entrada" : "text-saida"}`}>{brl(total)}</p>
          {de > "0001" && (
            <p className="mt-1 text-[13px] text-tinta-fraca">
              De {dataBr(de)} a {dataBr(ate)}
            </p>
          )}
          {linhas.length > 5 && (
            <p className="mt-4 border-t border-linha pt-4 text-sm text-tinta-suave">
              Os 5 maiores somam <strong className="text-tinta">{percentual(cinco, total)}</strong> do total, entre {linhas.length} {NOMES_DIMENSAO[dimensao]}.
            </p>
          )}
        </section>
      </aside>

      <section className="superficie overflow-hidden xl:order-1" aria-label="Ranking">
        {linhas.length ? (
          <ol>
            {linhas.map((g, i) => (
              <li key={g.nome} className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-x-3 border-b border-linha/60 px-4 py-3 last:border-b-0 sm:px-5 lg:grid-cols-[28px_minmax(0,1.2fr)_minmax(0,1fr)_150px_90px]">
                <span className="valor text-sm font-semibold text-tinta-fraca">{i + 1}</span>
                <span className="min-w-0 truncate text-[15px] font-semibold">{g.nome.replace(":", " › ")}</span>
                <span className="col-span-2 col-start-2 row-start-2 mt-1.5 flex items-center gap-2 lg:col-span-1 lg:col-start-3 lg:row-start-1 lg:mt-0">
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-fundo">
                    <span
                      className={`block h-full origin-left animate-crescer rounded-full ${receita ? "bg-entrada" : "bg-saida"}`}
                      style={{ width: `${Math.max((g[natureza] / maior) * 100, 1)}%`, animationDelay: `${Math.min(i, 12) * 30}ms` }}
                    />
                  </span>
                  <span className="valor w-12 text-right text-xs text-tinta-fraca lg:hidden">{percentual(g[natureza], total)}</span>
                </span>
                <span className="valor text-right text-[15px] font-bold">{brl(g[natureza])}</span>
                <span className="valor hidden text-right text-[13px] text-tinta-fraca lg:block">
                  {percentual(g[natureza], total)}
                  <br />
                  {g.quantidade} lanç.
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <Vazio titulo="Nenhum lançamento neste período">Escolha um período maior.</Vazio>
        )}
      </section>
    </div>
  );
}

async function Vencimentos({ lado, hoje }: { lado: "pagar" | "receber"; hoje: string }) {
  const programacoes = await dados.programacoes();
  const faixas = porVencimento(programacoes, lado, hoje).filter((f) => f.itens.length);
  const total = faixas.reduce((s, f) => s + f.total, 0);

  if (!faixas.length) {
    return (
      <section className="superficie">
        <Vazio titulo={`Nenhuma conta ${lado === "pagar" ? "a pagar" : "a receber"} em aberto`} />
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-tinta-suave">
        Em aberto: <span className="valor font-bold text-tinta">{brl(total)}</span>, contando a próxima parcela de cada conta. Para pagar ou editar, use{" "}
        <Link href={`/contas?lado=${lado}`} className="font-semibold text-cedula-medio underline">
          Pagar e receber
        </Link>
        .
      </p>
      <div className="grid gap-5 2xl:grid-cols-2">
        {faixas.map((f) => (
          <section key={f.id} className="superficie overflow-hidden">
            <header className="flex items-baseline justify-between gap-3 border-b border-linha px-4 py-3.5 sm:px-5">
              <h2 className="text-lg font-semibold">
                {f.rotulo} <span className="font-sans text-sm font-semibold text-tinta-fraca">{f.itens.length}</span>
              </h2>
              <span className="valor font-bold">{brl(f.total)}</span>
            </header>
            <ul className="divide-y divide-linha/60">
              {f.itens.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
                  <SeloData dias={diasEntre(hoje, p.vencimento)} data={p.vencimento} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold">{p.pessoa || p.historico || "Sem nome"}</span>
                    <span className="block truncate text-[13px] text-tinta-fraca">{[p.conta, p.plano.replace(":", " › ")].filter(Boolean).join(", ")}</span>
                  </span>
                  <span className="valor shrink-0 text-[15px] font-bold">{brl(p.valor)}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
