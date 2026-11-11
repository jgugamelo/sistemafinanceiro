import { BaixarProgramacao, EditarProgramacao, NovaProgramacao } from "@/components/Abridores";
import { Cabecalho, Chips, SeloData, Vazio } from "@/components/ui/Partes";
import { porVencimento } from "@/lib/calculos";
import { dados } from "@/lib/dados";
import { brl, diasEntre, hojeIso } from "@/lib/formato";
import { opcoes } from "@/lib/opcoes";
import type { Programacao } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pagar e receber" };

function repeticao(p: Programacao) {
  if (p.frequencia === "Uma única vez") return "Pagamento único";
  if (p.restantes === 1) return `${p.frequencia}, última parcela`;
  if (p.restantes) return `${p.frequencia}, ${p.restantes} parcelas`;
  return `${p.frequencia}, sem data para acabar`;
}

const TONS: Record<string, string> = {
  vencidas: "border-saida/25 bg-saida-claro/60 text-saida",
  hoje: "border-alerta/25 bg-alerta-claro/70 text-alerta",
};

export default async function ContasPage({ searchParams }: { searchParams: { lado?: string } }) {
  const lado: Programacao["tipo"] = searchParams.lado === "receber" ? "receber" : "pagar";
  const [programacoes, sugestoes] = await Promise.all([dados.programacoes(), opcoes()]);
  const hoje = hojeIso();
  const faixas = porVencimento(programacoes, lado, hoje);
  const total = faixas.reduce((s, f) => s + f.total, 0);
  const totais = {
    pagar: porVencimento(programacoes, "pagar", hoje).reduce((s, f) => s + f.total, 0),
    receber: porVencimento(programacoes, "receber", hoje).reduce((s, f) => s + f.total, 0),
  };
  const pagar = lado === "pagar";

  return (
    <>
      <Cabecalho titulo="Pagar e receber" descricao="Contas programadas, da mais atrasada para a mais distante. Valores da próxima parcela.">
        <NovaProgramacao opcoes={sugestoes} tipo={lado} />
      </Cabecalho>

      <div className="mb-5">
        <Chips
          rotulo="A pagar ou a receber"
          atual={lado}
          href={(id) => `/contas?lado=${id}`}
          opcoes={[
            { id: "pagar", rotulo: "A pagar", extra: brl(totais.pagar) },
            { id: "receber", rotulo: "A receber", extra: brl(totais.receber) },
          ]}
        />
      </div>

      <nav aria-label="Resumo por vencimento" className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {faixas.map((f) => (
          <a
            key={f.id}
            href={f.itens.length ? `#faixa-${f.id}` : undefined}
            aria-disabled={!f.itens.length}
            className={`rounded-2xl border p-4 transition-shadow ${f.itens.length ? "hover:shadow-flutuante" : "opacity-60"} ${
              f.itens.length && TONS[f.id] ? TONS[f.id] : "superficie text-tinta"
            } ${f.id === "depois" ? "col-span-2 sm:col-span-1" : ""}`}
          >
            <p className="text-[13px] font-semibold opacity-80">{f.rotulo}</p>
            <p className="valor mt-1 font-titulo text-[22px] font-semibold leading-tight">{brl(f.total)}</p>
            <p className="mt-1 text-xs opacity-70">{f.itens.length === 1 ? "1 conta" : `${f.itens.length} contas`}</p>
          </a>
        ))}
      </nav>

      {total === 0 ? (
        <section className="superficie">
          <Vazio titulo={pagar ? "Nenhuma conta a pagar" : "Nenhuma conta a receber"}>Crie uma conta para ela aparecer aqui e no painel.</Vazio>
        </section>
      ) : (
        <div className="flex flex-col gap-5">
          {faixas
            .filter((f) => f.itens.length)
            .map((f) => (
              <section key={f.id} id={`faixa-${f.id}`} className="superficie scroll-mt-6 overflow-hidden">
                <header className="flex items-baseline justify-between gap-3 border-b border-linha px-4 py-3.5 sm:px-5">
                  <h2 className="text-lg font-semibold">
                    {f.rotulo} <span className="font-sans text-sm font-semibold text-tinta-fraca">{f.itens.length}</span>
                  </h2>
                  <span className="valor text-[15px] font-bold">{brl(f.total)}</span>
                </header>
                <ul className="divide-y divide-linha/60">
                  {f.itens.map((p) => (
                    <li key={p.id} className="flex items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4">
                      <SeloData dias={diasEntre(hoje, p.vencimento)} data={p.vencimento} />
                      <EditarProgramacao opcoes={sugestoes} conta={p}>
                        <span className="grid items-center gap-x-4 px-2 py-1.5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,.8fr)_minmax(0,1fr)]">
                          <span className="min-w-0">
                            <span className="block truncate text-[15px] font-semibold">{p.pessoa || p.historico || "Sem nome"}</span>
                            <span className="block truncate text-[13px] text-tinta-fraca lg:hidden">
                              <span className={`valor font-bold sm:hidden ${pagar ? "text-tinta" : "text-entrada"}`}>{brl(p.valor)} </span>
                              {[p.conta, repeticao(p)].filter(Boolean).join(", ")}
                            </span>
                            {p.historico && p.pessoa && <span className="hidden truncate text-[13px] text-tinta-fraca lg:block">{p.historico}</span>}
                          </span>
                          <span className="hidden truncate text-sm text-tinta-suave lg:block">{p.plano.replace(":", " › ") || "—"}</span>
                          <span className="hidden truncate text-sm text-tinta-suave lg:block">{p.conta || "—"}</span>
                          <span className="hidden truncate text-sm text-tinta-suave lg:block">{repeticao(p)}</span>
                        </span>
                      </EditarProgramacao>
                      <span className={`valor hidden shrink-0 text-right text-[15px] font-bold sm:block sm:w-28 ${pagar ? "" : "text-entrada"}`}>{brl(p.valor)}</span>
                      <BaixarProgramacao opcoes={sugestoes} conta={p} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
        </div>
      )}
    </>
  );
}
