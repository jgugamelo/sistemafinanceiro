import Link from "next/link";
import { EditarLancamento, NovoLancamento } from "@/components/Abridores";
import { Icone } from "@/components/ui/Icone";
import { Cabecalho, Chips, SemDados, Vazio } from "@/components/ui/Partes";
import { intervalo, PERIODOS } from "@/lib/calculos";
import { dados } from "@/lib/dados";
import { brl, brlCurto, hojeIso } from "@/lib/formato";
import { opcoes } from "@/lib/opcoes";
import type { Lancamento } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lançamentos" };

const TIPOS = [
  { id: "todos", rotulo: "Todos" },
  { id: "despesa", rotulo: "Despesas" },
  { id: "receita", rotulo: "Receitas" },
  { id: "transferencia", rotulo: "Transferências" },
] as const;

const PASSO = 150;
const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function rotuloDia(iso: string, hoje: string) {
  if (iso === hoje) return "Hoje";
  const d = new Date(`${iso}T12:00:00Z`);
  const ontem = new Date(`${hoje}T12:00:00Z`);
  ontem.setUTCDate(ontem.getUTCDate() - 1);
  if (iso === ontem.toISOString().slice(0, 10)) return "Ontem";
  const ano = iso.slice(0, 4) !== hoje.slice(0, 4) ? ` de ${iso.slice(0, 4)}` : "";
  return `${DIAS[d.getUTCDay()]}, ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]}${ano}`;
}

const sem = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

type Busca = { conta?: string; tipo?: string; periodo?: string; busca?: string; limite?: string };

export default async function LancamentosPage({ searchParams }: { searchParams: Busca }) {
  const [todos, sugestoes] = await Promise.all([dados.lancamentos(), opcoes()]);
  if (!todos.length) return <SemDados />;

  const hoje = hojeIso();
  const periodo = intervalo(searchParams.periodo ?? "mes", hoje);
  const tipo = TIPOS.find((t) => t.id === searchParams.tipo)?.id ?? "todos";
  const contas = [...new Set(todos.map((l) => l.conta))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const conta = contas.includes(searchParams.conta ?? "") ? searchParams.conta! : "";
  const busca = (searchParams.busca ?? "").trim();
  const limite = Math.max(PASSO, Number(searchParams.limite) || PASSO);

  const termo = sem(busca);
  const filtrados = todos
    .filter(
      (l) =>
        l.data >= periodo.de &&
        l.data <= periodo.ate &&
        (tipo === "todos" || l.tipo === tipo) &&
        (!conta || l.conta === conta) &&
        (!termo || sem(`${l.pessoa} ${l.historico} ${l.plano} ${l.centro} ${l.conta}`).includes(termo)),
    )
    .sort((a, b) => b.data.localeCompare(a.data) || b.id.localeCompare(a.id, undefined, { numeric: true }));

  let entradas = 0;
  let saidas = 0;
  for (const l of filtrados) {
    if (l.valor >= 0) entradas += l.valor;
    else saidas -= l.valor;
  }

  const visiveis = filtrados.slice(0, limite);
  const dias: { data: string; itens: Lancamento[]; total: number }[] = [];
  for (const l of visiveis) {
    const ultimo = dias[dias.length - 1];
    if (ultimo?.data === l.data) {
      ultimo.itens.push(l);
      ultimo.total += l.valor;
    } else dias.push({ data: l.data, itens: [l], total: l.valor });
  }

  const link = (mudanca: Busca) => {
    const p = new URLSearchParams();
    const final = { conta, tipo, periodo: periodo.id, busca, ...mudanca };
    for (const [k, v] of Object.entries(final)) if (v && !(k === "tipo" && v === "todos") && !(k === "periodo" && v === "mes")) p.set(k, String(v));
    const q = p.toString();
    return `/lancamentos${q ? `?${q}` : ""}`;
  };

  return (
    <>
      <Cabecalho titulo="Lançamentos" descricao="Tudo o que entrou e saiu das contas.">
        <div className="hidden lg:block">
          <NovoLancamento opcoes={sugestoes} />
        </div>
      </Cabecalho>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-4">
          <form action="/lancamentos" className="relative">
            {conta && <input type="hidden" name="conta" value={conta} />}
            {tipo !== "todos" && <input type="hidden" name="tipo" value={tipo} />}
            {periodo.id !== "mes" && <input type="hidden" name="periodo" value={periodo.id} />}
            <Icone nome="busca" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-tinta-fraca" />
            <input
              type="search"
              name="busca"
              defaultValue={busca}
              placeholder="Buscar por nome, observação ou plano de contas"
              aria-label="Buscar lançamentos"
              className="campo h-12 rounded-2xl pl-12 text-[15px]"
            />
          </form>

          <div className="flex flex-col gap-2">
            <Chips rotulo="Período" opcoes={PERIODOS} atual={periodo.id} href={(id) => link({ periodo: id, limite: undefined })} />
            <Chips rotulo="Tipo" opcoes={TIPOS} atual={tipo} href={(id) => link({ tipo: id, limite: undefined })} />
            <div className="xl:hidden">
              <Chips
                rotulo="Conta"
                opcoes={[{ id: "", rotulo: "Todas as contas" }, ...contas.map((c) => ({ id: c, rotulo: c }))]}
                atual={conta}
                href={(id) => link({ conta: id, limite: undefined })}
              />
            </div>
          </div>

          <dl className="grid grid-cols-3 gap-2 xl:hidden" aria-label="Totais do filtro">
            {[
              { r: "Entradas", v: entradas, t: "text-entrada" },
              { r: "Saídas", v: saidas, t: "text-saida" },
              { r: "Diferença", v: entradas - saidas, t: "" },
            ].map((x) => (
              <div key={x.r} className="superficie px-3 py-2.5">
                <dt className="text-xs text-tinta-fraca">{x.r}</dt>
                <dd className={`valor truncate text-[15px] font-bold ${x.t}`} title={brl(x.v)}>
                  <span className="sm:hidden">{brlCurto(x.v)}</span>
                  <span className="hidden sm:inline">{brl(x.v)}</span>
                </dd>
              </div>
            ))}
          </dl>

          <section className="superficie overflow-hidden" aria-label="Lista de lançamentos">
            {dias.length === 0 ? (
              <Vazio titulo="Nenhum lançamento com esses filtros">
                {busca ? (
                  <>
                    Nada encontrado para &ldquo;{busca}&rdquo;. <Link href={link({ busca: "" })} className="font-semibold text-cedula-medio underline">Limpar a busca</Link>
                  </>
                ) : (
                  "Tente outro período ou outra conta."
                )}
              </Vazio>
            ) : (
              dias.map((dia) => (
                <div key={dia.data}>
                  <h3
                    className="sticky top-0 z-[1] flex items-baseline justify-between border-b border-linha/70 bg-[#F7F9F7]/95 px-4 py-2 text-[13px] font-bold text-tinta-suave backdrop-blur sm:px-5"
                    style={{ fontFamily: "inherit", letterSpacing: 0 }}
                  >
                    <span className="first-letter:uppercase">{rotuloDia(dia.data, hoje)}</span>
                    <span className={`valor ${dia.total >= 0 ? "text-entrada" : "text-saida"}`}>{brl(dia.total)}</span>
                  </h3>
                  <ul className="divide-y divide-linha/60">
                    {dia.itens.map((l) => (
                      <li key={l.id}>
                        <EditarLancamento opcoes={sugestoes} lancamento={l}>
                          <span className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-5 lg:grid-cols-[36px_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,.8fr)_140px]">
                            <span
                              className={`grid h-9 w-9 place-items-center rounded-xl ${
                                l.tipo === "transferencia" ? "bg-cedula-claro text-cedula" : l.valor >= 0 ? "bg-entrada-claro text-entrada" : "bg-saida-claro text-saida"
                              }`}
                            >
                              <Icone nome={l.tipo === "transferencia" ? "transferencia" : l.valor >= 0 ? "entrada" : "saida"} className="h-[18px] w-[18px]" />
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-[15px] font-semibold">{l.pessoa || l.historico || "Sem descrição"}</span>
                              <span className="block truncate text-[13px] text-tinta-fraca">
                                <span className="lg:hidden">{[l.conta, l.plano.replace(":", " › ")].filter(Boolean).join(", ")}</span>
                                <span className="hidden lg:inline">{l.pessoa ? l.historico : ""}</span>
                              </span>
                            </span>
                            <span className="hidden min-w-0 truncate text-sm text-tinta-suave lg:block">{l.plano.replace(":", " › ") || "—"}</span>
                            <span className="hidden min-w-0 truncate text-sm text-tinta-suave lg:block">{l.conta}</span>
                            <span className={`valor text-right text-[15px] font-bold ${l.valor >= 0 ? "text-entrada" : "text-tinta"}`}>
                              {l.valor >= 0 ? "+" : "−"}
                              {brl(Math.abs(l.valor))}
                            </span>
                          </span>
                        </EditarLancamento>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
            {filtrados.length > visiveis.length && (
              <div className="border-t border-linha p-4 text-center">
                <Link href={link({ limite: String(limite + PASSO) })} scroll={false} className="botao-secundario">
                  Mostrar mais {Math.min(PASSO, filtrados.length - visiveis.length)} de {filtrados.length - visiveis.length}
                </Link>
              </div>
            )}
          </section>
        </div>

        <aside className="hidden flex-col gap-4 xl:sticky xl:top-8 xl:flex xl:self-start">
          <section className="superficie p-5" aria-label="Totais do filtro">
            <p className="text-sm font-semibold text-tinta-suave">{filtrados.length === 1 ? "1 lançamento" : `${filtrados.length.toLocaleString("pt-BR")} lançamentos`}</p>
            <dl className="mt-3 grid grid-cols-3 gap-3 xl:grid-cols-1">
              <div>
                <dt className="text-[13px] text-tinta-fraca">Entradas</dt>
                <dd className="valor text-lg font-bold text-entrada xl:text-xl">{brl(entradas)}</dd>
              </div>
              <div>
                <dt className="text-[13px] text-tinta-fraca">Saídas</dt>
                <dd className="valor text-lg font-bold text-saida xl:text-xl">{brl(saidas)}</dd>
              </div>
              <div>
                <dt className="text-[13px] text-tinta-fraca">Diferença</dt>
                <dd className="valor text-lg font-bold xl:text-xl">{brl(entradas - saidas)}</dd>
              </div>
            </dl>
            {tipo === "todos" && <p className="mt-3 text-xs text-tinta-fraca">Inclui transferências entre as contas.</p>}
          </section>

          <section className="superficie p-2" aria-label="Filtrar por conta">
            <p className="px-3 pb-1 pt-2 text-sm font-semibold text-tinta-suave">Conta</p>
            <nav className="flex flex-col">
              {["", ...contas].map((c) => (
                <Link
                  key={c || "todas"}
                  href={link({ conta: c, limite: undefined })}
                  scroll={false}
                  aria-current={c === conta ? "true" : undefined}
                  className={`rounded-xl px-3 py-2 text-[15px] font-medium transition-colors ${c === conta ? "bg-cedula-claro font-semibold text-cedula" : "text-tinta-suave hover:bg-fundo hover:text-tinta"}`}
                >
                  {c || "Todas as contas"}
                </Link>
              ))}
            </nav>
          </section>
        </aside>
      </div>
    </>
  );
}
