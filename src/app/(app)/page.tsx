import Link from "next/link";
import { BaixarProgramacao } from "@/components/Abridores";
import { CartaoSaldo } from "@/components/painel/CartaoSaldo";
import { GraficoMensal } from "@/components/painel/GraficoMensal";
import { Icone } from "@/components/ui/Icone";
import { Barras, Cabecalho, Painel, SeloData, SemDados, Vazio } from "@/components/ui/Partes";
import { agrupar, historicoSaldos, intervalo, porVencimento, resumo, serieMensal } from "@/lib/calculos";
import { dados } from "@/lib/dados";
import { brl, dataBr, diasEntre, hojeIso, mesCurto, percentual } from "@/lib/formato";
import { opcoes } from "@/lib/opcoes";
import type { Programacao } from "@/lib/types";

export const dynamic = "force-dynamic";

const DIAS_SEMANA = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];

function Comparacao({
  atual,
  anterior,
  mes,
  menorMelhor = false,
  emReais = false,
}: {
  atual: number;
  anterior: number;
  mes: string;
  menorMelhor?: boolean;
  emReais?: boolean;
}) {
  if (!anterior) return <span className="text-tinta-fraca">Sem dados de {mes}</span>;
  if (emReais) {
    // percentual não faz sentido quando o mês anterior foi negativo: mostra a diferença em reais
    const dif = atual - anterior;
    return (
      <span className="flex items-center gap-1.5">
        <span className={`valor inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-bold ${dif >= 0 ? "bg-entrada-claro text-entrada" : "bg-saida-claro text-saida"}`}>
          <Icone nome={dif >= 0 ? "entrada" : "saida"} className="h-3 w-3" />
          {brl(Math.abs(dif))}
        </span>
        <span className="text-tinta-fraca">
          {dif >= 0 ? "melhor" : "pior"} que {mes}
        </span>
      </span>
    );
  }
  const diferenca = (atual - anterior) / Math.abs(anterior);
  const subiu = diferenca >= 0;
  const bom = menorMelhor ? !subiu : subiu;
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-bold ${bom ? "bg-entrada-claro text-entrada" : "bg-saida-claro text-saida"}`}>
        <Icone nome={subiu ? "entrada" : "saida"} className="h-3 w-3" />
        {Math.abs(diferenca * 100).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%
      </span>
      <span className="text-tinta-fraca">
        {subiu ? "acima" : "abaixo"} de {mes}
      </span>
    </span>
  );
}

function LinhaAgenda({ rotulo, quantidade, total, href, tom }: { rotulo: string; quantidade: number; total: number; href: string; tom?: string }) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-fundo">
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold">{rotulo}</span>
        <span className="block text-[13px] text-tinta-fraca">{quantidade === 0 ? "nenhuma conta" : quantidade === 1 ? "1 conta" : `${quantidade} contas`}</span>
      </span>
      <span className={`valor text-[17px] font-bold ${quantidade ? (tom ?? "") : "text-tinta-fraca"}`}>{brl(total)}</span>
      <Icone nome="seta" className="h-4 w-4 text-tinta-fraca transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

export default async function PainelPage() {
  const [lancamentos, programacoes, sugestoes] = await Promise.all([dados.lancamentos(), dados.programacoes(), opcoes()]);
  if (!lancamentos.length) return <SemDados />;

  const hoje = hojeIso();
  const mes = intervalo("mes", hoje);
  const anterior = intervalo("mes-anterior", hoje);
  const doMes = resumo(lancamentos, mes.de, mes.ate);
  const doAnterior = resumo(lancamentos, anterior.de, anterior.ate);
  const nomeAnterior = mesCurto(anterior.de.slice(0, 7));

  const pagar = porVencimento(programacoes, "pagar", hoje);
  const receber = porVencimento(programacoes, "receber", hoje);
  const faixa = (lista: typeof pagar, ...ids: string[]) => {
    const itens = lista.filter((f) => ids.includes(f.id)).flatMap((f) => f.itens);
    return { itens, total: itens.reduce((s, p) => s + p.valor, 0) };
  };
  const vencidas = faixa(pagar, "vencidas");
  const hojePagar = faixa(pagar, "hoje");
  const semana = faixa(pagar, "7dias");
  const receber30 = faixa(receber, "vencidas", "hoje", "7dias", "30dias");

  const grupos = agrupar(lancamentos, "grupo", mes.de, mes.ate)
    .filter((g) => g.despesas > 0)
    .sort((a, b) => b.despesas - a.despesas)
    .slice(0, 7);

  const proximasPagar = faixa(pagar, "vencidas", "hoje", "7dias", "30dias").itens.slice(0, 7);
  const proximasReceber = receber30.itens.slice(0, 7);
  const diaSemana = DIAS_SEMANA[new Date(`${hoje}T12:00:00Z`).getUTCDay()];

  const ListaContas = ({ itens, vazio }: { itens: Programacao[]; vazio: string }) =>
    itens.length ? (
      <ul className="-mx-2 divide-y divide-linha/70">
        {itens.map((p) => (
          <li key={p.id} className="flex items-center gap-3 px-2 py-2.5">
            <SeloData dias={diasEntre(hoje, p.vencimento)} data={p.vencimento} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold">{p.pessoa || p.historico || "Sem nome"}</span>
              <span className="block truncate text-[13px] text-tinta-fraca">
                <span className="valor font-bold text-tinta sm:hidden">{brl(p.valor)} </span>
                {p.conta || "Conta não definida"}
              </span>
            </span>
            <span className="valor hidden shrink-0 text-[15px] font-bold sm:block">{brl(p.valor)}</span>
            <BaixarProgramacao opcoes={sugestoes} conta={p} />
          </li>
        ))}
      </ul>
    ) : (
      <Vazio titulo={vazio} />
    );

  return (
    <>
      <Cabecalho titulo="Painel" descricao={`Hoje é ${diaSemana}, ${dataBr(hoje)}`} />

      <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <CartaoSaldo historico={historicoSaldos(lancamentos, hoje)} />
        </div>

        <section className="superficie flex flex-col p-3 sm:p-4 xl:col-span-4" aria-labelledby="titulo-agenda">
          <h2 id="titulo-agenda" className="px-3 pb-1 pt-2 text-lg font-semibold">
            O que vence
          </h2>
          <div className="flex flex-1 flex-col divide-y divide-linha/70">
            <LinhaAgenda rotulo="A pagar vencido" quantidade={vencidas.itens.length} total={vencidas.total} href="/contas?lado=pagar" tom="text-saida" />
            <LinhaAgenda rotulo="A pagar hoje" quantidade={hojePagar.itens.length} total={hojePagar.total} href="/contas?lado=pagar" tom="text-alerta" />
            <LinhaAgenda rotulo="A pagar nos próximos 7 dias" quantidade={semana.itens.length} total={semana.total} href="/contas?lado=pagar" />
            <LinhaAgenda rotulo="A receber em 30 dias" quantidade={receber30.itens.length} total={receber30.total} href="/contas?lado=receber" tom="text-entrada" />
          </div>
        </section>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 xl:col-span-12">
          {[
            { rotulo: "Receitas do mês", valor: doMes.receitas, ant: doAnterior.receitas, tom: "text-entrada", menor: false, reais: false, href: "/relatorios?tipo=pessoa&natureza=receitas" },
            { rotulo: "Despesas do mês", valor: doMes.despesas, ant: doAnterior.despesas, tom: "text-saida", menor: true, reais: false, href: "/relatorios?tipo=plano&natureza=despesas" },
            { rotulo: "Resultado do mês", valor: doMes.resultado, ant: doAnterior.resultado, tom: doMes.resultado >= 0 ? "text-entrada" : "text-saida", menor: false, reais: true, href: "/lancamentos" },
          ].map((k, i) => (
            <Link key={k.rotulo} href={k.href} className={`superficie group p-4 transition-shadow hover:shadow-flutuante sm:p-5 ${i === 2 ? "col-span-2 sm:col-span-1" : ""}`}>
              <p className="text-sm font-semibold text-tinta-suave">{k.rotulo}</p>
              <p className={`valor mt-1.5 font-titulo text-[22px] font-semibold leading-tight sm:text-[30px] ${k.tom}`}>{brl(k.valor)}</p>
              <p className="mt-2 text-[13px]">
                <Comparacao atual={k.valor} anterior={k.ant} mes={nomeAnterior} menorMelhor={k.menor} emReais={k.reais} />
              </p>
            </Link>
          ))}
        </div>

        <Painel titulo="Receitas e despesas nos últimos 12 meses" className="xl:col-span-8">
          <div className="mb-3 flex gap-5 text-[13px] font-semibold text-tinta-suave">
            <span className="flex items-center gap-2">
              <i className="h-2.5 w-2.5 rounded-[3px] bg-entrada" />
              Receitas
            </span>
            <span className="flex items-center gap-2">
              <i className="h-2.5 w-2.5 rounded-[3px] bg-saida" />
              Despesas
            </span>
          </div>
          <GraficoMensal dados={serieMensal(lancamentos, hoje)} />
        </Painel>

        <Painel titulo="Para onde foi o dinheiro este mês" acao={{ rotulo: "Detalhar", href: "/relatorios?tipo=plano" }} className="xl:col-span-4">
          <Barras itens={grupos.map((g) => ({ nome: g.nome, valor: g.despesas, detalhe: percentual(g.despesas, doMes.despesas) }))} />
        </Painel>

        <Painel titulo="Próximas contas a pagar" acao={{ rotulo: "Ver todas", href: "/contas?lado=pagar" }} className="xl:col-span-6">
          <ListaContas itens={proximasPagar} vazio="Nada a pagar nos próximos 30 dias" />
        </Painel>

        <Painel titulo="Próximos recebimentos" acao={{ rotulo: "Ver todos", href: "/contas?lado=receber" }} className="xl:col-span-6">
          <ListaContas itens={proximasReceber} vazio="Nada a receber nos próximos 30 dias" />
        </Painel>
      </div>
    </>
  );
}
