import { Chips, SemDados } from "@/components/Pecas";
import { agrupar, intervalo, PERIODOS, porVencimento, type Dimensao } from "@/lib/calculos";
import { dados } from "@/lib/dados";
import { brl, dataBr, diasEntre, hojeIso, percentual } from "@/lib/formato";

export const dynamic = "force-dynamic";

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
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-titulo text-2xl font-semibold">Relatórios</h1>
      </header>

      <Chips rotulo="Relatório" opcoes={TIPOS} atual={tipo} href={(id) => link({ tipo: id })} />

      {tipo === "vencimentos" ? (
        <>
          <Chips rotulo="Lado" opcoes={LADOS} atual={lado} href={(id) => link({ lado: id })} />
          <Vencimentos lado={lado} hoje={hoje} />
        </>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <Chips rotulo="Natureza" opcoes={NATUREZAS} atual={natureza} href={(id) => link({ natureza: id })} />
            <Chips rotulo="Período" opcoes={PERIODOS} atual={periodo.id} href={(id) => link({ periodo: id })} />
          </div>
          <Agrupado dimensao={tipo} natureza={natureza} de={periodo.de} ate={periodo.ate} />
        </>
      )}
    </div>
  );
}

async function Agrupado({ dimensao, natureza, de, ate }: { dimensao: Dimensao; natureza: "receitas" | "despesas"; de: string; ate: string }) {
  const lancamentos = await dados.lancamentos();
  if (!lancamentos.length) return <SemDados />;

  const linhas = agrupar(lancamentos, dimensao, de, ate)
    .filter((g) => g[natureza] > 0)
    .sort((a, b) => b[natureza] - a[natureza]);
  const total = linhas.reduce((s, g) => s + g[natureza], 0);
  const maior = linhas[0]?.[natureza] ?? 1;
  const cor = natureza === "receitas" ? "bg-entrada" : "bg-saida";

  return (
    <section className="cartao overflow-hidden">
      <div className="flex items-baseline justify-between gap-3 border-b border-linha p-4 sm:p-5">
        <div>
          <p className="text-xs font-medium text-tinta/60">Total de {natureza}</p>
          <p className={`numero text-2xl font-semibold ${natureza === "receitas" ? "text-entrada" : "text-saida"}`}>{brl(total)}</p>
        </div>
        <p className="text-right text-xs text-tinta/50">
          {linhas.length} {linhas.length === 1 ? "linha" : "linhas"}
          {de > "0001" && (
            <>
              <br />
              {dataBr(de)} a {dataBr(ate)}
            </>
          )}
        </p>
      </div>

      {linhas.length ? (
        <ol className="divide-y divide-linha">
          {linhas.map((g, i) => (
            <li key={g.nome} className="px-4 py-3 sm:px-5">
              <div className="flex items-baseline gap-3 text-sm">
                <span className="w-6 shrink-0 text-xs text-tinta/40">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate">{g.nome.replace(":", " › ")}</span>
                <span className="numero shrink-0 font-medium">{brl(g[natureza])}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-3 pl-9">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-tinta/5">
                  <div className={`h-full rounded-full ${cor}`} style={{ width: `${Math.max((g[natureza] / maior) * 100, 1)}%` }} />
                </div>
                <span className="w-28 shrink-0 text-right text-xs text-tinta/50">
                  {percentual(g[natureza], total)} · {g.quantidade} lanç.
                </span>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="p-8 text-center text-sm text-tinta/50">Nenhum lançamento neste período.</p>
      )}
    </section>
  );
}

async function Vencimentos({ lado, hoje }: { lado: "pagar" | "receber"; hoje: string }) {
  const programacoes = await dados.programacoes();
  const faixas = porVencimento(programacoes, lado, hoje).filter((f) => f.itens.length);
  const total = faixas.reduce((s, f) => s + f.total, 0);

  if (!faixas.length) {
    return <p className="cartao p-8 text-center text-sm text-tinta/50">Nenhuma conta {lado === "pagar" ? "a pagar" : "a receber"} em aberto.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-tinta/60">
        Em aberto: <span className="numero font-semibold text-tinta">{brl(total)}</span>, contando a próxima parcela de cada conta.
      </p>
      {faixas.map((f) => (
        <section key={f.id} className="cartao overflow-hidden">
          <div className={`flex items-baseline justify-between gap-3 border-b border-linha px-4 py-3 sm:px-5 ${f.id === "vencidas" ? "bg-red-50" : f.id === "hoje" ? "bg-amber-50" : ""}`}>
            <h2 className="font-titulo text-sm font-semibold">
              {f.rotulo} <span className="font-normal text-tinta/50">· {f.itens.length}</span>
            </h2>
            <span className="numero text-sm font-semibold">{brl(f.total)}</span>
          </div>
          <ul className="divide-y divide-linha">
            {f.itens.map((p) => {
              const dias = diasEntre(hoje, p.vencimento);
              return (
                <li key={p.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <span className="w-[4.5rem] shrink-0 text-xs text-tinta/60">
                    {dataBr(p.vencimento).slice(0, 5)}
                    {dias < 0 && <span className="block text-saida">há {-dias} d</span>}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{p.pessoa || p.historico || "(sem nome)"}</span>
                    <span className="block truncate text-xs text-tinta/50">
                      {[p.conta, p.plano.replace(":", " › "), p.frequencia].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <span className="numero shrink-0 text-sm font-medium">{brl(p.valor)}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
