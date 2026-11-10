import { GraficoMensal } from "@/components/GraficoMensal";
import { Barras, Kpi, Secao, SemDados } from "@/components/Pecas";
import { agrupar, intervalo, porVencimento, resumo, saldosPorConta, serieMensal } from "@/lib/calculos";
import { dados } from "@/lib/dados";
import { brl, dataBr, diasEntre, hojeIso, mesCurto, percentual } from "@/lib/formato";

export const dynamic = "force-dynamic";

export default async function Painel() {
  const [lancamentos, programacoes] = await Promise.all([dados.lancamentos(), dados.programacoes()]);
  if (!lancamentos.length) return <SemDados />;

  const hoje = hojeIso();
  const mes = intervalo("mes", hoje);
  const anterior = intervalo("mes-anterior", hoje);
  const doMes = resumo(lancamentos, mes.de, mes.ate);
  const doAnterior = resumo(lancamentos, anterior.de, anterior.ate);
  const rotuloAnterior = mesCurto(anterior.de.slice(0, 7));

  const contas = saldosPorConta(lancamentos, hoje);
  const saldoTotal = contas.reduce((s, c) => s + c.saldo, 0);

  const pagar = porVencimento(programacoes, "pagar", hoje);
  const receber = porVencimento(programacoes, "receber", hoje);
  const faixa = (lista: typeof pagar, id: string) => lista.find((f) => f.id === id)!;
  const pagarSemana = faixa(pagar, "hoje").total + faixa(pagar, "7dias").total;
  const receber30 = ["vencidas", "hoje", "7dias", "30dias"].reduce((s, id) => s + faixa(receber, id).total, 0);

  const grupos = agrupar(lancamentos, "grupo", mes.de, mes.ate)
    .filter((g) => g.despesas > 0)
    .sort((a, b) => b.despesas - a.despesas)
    .slice(0, 6);

  const proximas = pagar
    .filter((f) => f.id !== "depois")
    .flatMap((f) => f.itens)
    .slice(0, 8);

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-titulo text-2xl font-semibold">Painel</h1>
          <p className="text-sm text-tinta/60">Posição em {dataBr(hoje)}</p>
        </div>
      </header>

      <section className="rounded-2xl bg-tinta p-5 text-white sm:p-6">
        <p className="text-sm text-white/65">Saldo em contas</p>
        <p className="numero mt-1 text-3xl font-semibold sm:text-4xl">{brl(saldoTotal)}</p>
        <p className="mt-2 text-sm text-white/65">
          {contas.length} contas · resultado do mês{" "}
          <span className={doMes.resultado >= 0 ? "text-emerald-300" : "text-red-300"}>{brl(doMes.resultado)}</span>
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <Kpi rotulo="Receitas do mês" valor={doMes.receitas} tom="entrada" detalhe={`${rotuloAnterior}: ${brl(doAnterior.receitas)}`} href="/relatorios?tipo=pessoa&natureza=receitas" />
        <Kpi rotulo="Despesas do mês" valor={doMes.despesas} tom="saida" detalhe={`${rotuloAnterior}: ${brl(doAnterior.despesas)}`} href="/relatorios?tipo=plano" />
        <Kpi rotulo="Resultado do mês" valor={doMes.resultado} tom={doMes.resultado >= 0 ? "entrada" : "saida"} detalhe={`${rotuloAnterior}: ${brl(doAnterior.resultado)}`} />
        <Kpi rotulo="A pagar vencido" valor={faixa(pagar, "vencidas").total} tom={faixa(pagar, "vencidas").total > 0 ? "alerta" : "neutro"} detalhe={`${faixa(pagar, "vencidas").itens.length} contas`} href="/relatorios?tipo=vencimentos" />
        <Kpi rotulo="A pagar em 7 dias" valor={pagarSemana} detalhe={`${faixa(pagar, "hoje").itens.length + faixa(pagar, "7dias").itens.length} contas, com as de hoje`} href="/relatorios?tipo=vencimentos" />
        <Kpi rotulo="A receber em 30 dias" valor={receber30} tom="entrada" detalhe="próxima parcela de cada conta" />
      </div>

      <Secao titulo="Receitas e despesas, 12 meses">
        <div className="mb-2 flex gap-4 text-xs text-tinta/70">
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-entrada" />Receitas</span>
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-saida" />Despesas</span>
        </div>
        <GraficoMensal dados={serieMensal(lancamentos, hoje)} />
      </Secao>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <Secao titulo="Despesas do mês por grupo" acao={{ rotulo: "Detalhar", href: "/relatorios?tipo=plano" }}>
          <Barras itens={grupos.map((g) => ({ nome: g.nome, valor: g.despesas, detalhe: percentual(g.despesas, doMes.despesas) }))} />
        </Secao>

        <Secao titulo="Saldo por conta">
          <ul className="divide-y divide-linha">
            {contas.map((c) => (
              <li key={c.conta} className="flex items-baseline justify-between gap-3 py-2.5 text-sm first:pt-0 last:pb-0">
                <span className="min-w-0 truncate">{c.conta}</span>
                <span className={`numero shrink-0 font-medium ${c.saldo < 0 ? "text-saida" : ""}`}>{brl(c.saldo)}</span>
              </li>
            ))}
          </ul>
        </Secao>
      </div>

      <Secao titulo="Próximas contas a pagar" acao={{ rotulo: "Ver todas", href: "/relatorios?tipo=vencimentos" }}>
        {proximas.length ? (
          <ul className="divide-y divide-linha">
            {proximas.map((p) => {
              const dias = diasEntre(hoje, p.vencimento);
              return (
                <li key={p.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <span
                    className={`w-[4.5rem] shrink-0 rounded-lg px-2 py-1 text-center text-xs font-medium ${
                      dias < 0 ? "bg-red-50 text-saida" : dias === 0 ? "bg-amber-50 text-alerta" : "bg-tinta/5 text-tinta/70"
                    }`}
                  >
                    {dias < 0 ? `há ${-dias} d` : dias === 0 ? "hoje" : dataBr(p.vencimento).slice(0, 5)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{p.pessoa || p.historico || "(sem nome)"}</span>
                    <span className="block truncate text-xs text-tinta/50">{p.conta}</span>
                  </span>
                  <span className="numero shrink-0 text-sm font-medium">{brl(p.valor)}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="py-6 text-center text-sm text-tinta/50">Nenhuma conta a pagar nos próximos 30 dias.</p>
        )}
      </Secao>
    </div>
  );
}
