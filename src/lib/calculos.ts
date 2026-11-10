import { diasEntre, somarDias } from "./formato";
import type { Lancamento, Programacao } from "./types";

export const PERIODOS = [
  { id: "mes", rotulo: "Este mês" },
  { id: "mes-anterior", rotulo: "Mês passado" },
  { id: "90d", rotulo: "90 dias" },
  { id: "ano", rotulo: "Este ano" },
  { id: "12m", rotulo: "12 meses" },
  { id: "tudo", rotulo: "Tudo" },
] as const;
export type PeriodoId = (typeof PERIODOS)[number]["id"];

export interface Intervalo {
  id: PeriodoId;
  rotulo: string;
  de: string;
  ate: string;
}

const fimDoMes = (anoMes: string) => {
  const [a, m] = anoMes.split("-").map(Number);
  return `${anoMes}-${String(new Date(Date.UTC(a, m, 0)).getUTCDate()).padStart(2, "0")}`;
};

export const mesAnterior = (anoMes: string) => {
  const [a, m] = anoMes.split("-").map(Number);
  return m === 1 ? `${a - 1}-12` : `${a}-${String(m - 1).padStart(2, "0")}`;
};

export function intervalo(id: string | undefined, hoje: string): Intervalo {
  const periodo = PERIODOS.find((p) => p.id === id) ?? PERIODOS[0];
  const mes = hoje.slice(0, 7);
  const limites: Record<PeriodoId, [string, string]> = {
    mes: [`${mes}-01`, fimDoMes(mes)],
    "mes-anterior": [`${mesAnterior(mes)}-01`, fimDoMes(mesAnterior(mes))],
    "90d": [somarDias(hoje, -89), hoje],
    ano: [`${hoje.slice(0, 4)}-01-01`, `${hoje.slice(0, 4)}-12-31`],
    "12m": [somarDias(hoje, -364), hoje],
    tudo: ["0000-01-01", "9999-12-31"],
  };
  const [de, ate] = limites[periodo.id];
  return { id: periodo.id, rotulo: periodo.rotulo, de, ate };
}

/** Receitas e despesas de verdade: transferências entre contas próprias ficam de fora. */
const operacional = (l: Lancamento) => l.tipo !== "transferencia";
const dentro = (data: string, de: string, ate: string) => data >= de && data <= ate;

export function resumo(lancamentos: Lancamento[], de: string, ate: string) {
  let receitas = 0;
  let despesas = 0;
  for (const l of lancamentos) {
    if (!operacional(l) || !dentro(l.data, de, ate)) continue;
    if (l.valor >= 0) receitas += l.valor;
    else despesas -= l.valor;
  }
  return { receitas, despesas, resultado: receitas - despesas };
}

export function serieMensal(lancamentos: Lancamento[], hoje: string, meses = 12) {
  const chaves: string[] = [];
  let mes = hoje.slice(0, 7);
  for (let i = 0; i < meses; i++) {
    chaves.unshift(mes);
    mes = mesAnterior(mes);
  }
  const mapa = new Map(chaves.map((c) => [c, { mes: c, receitas: 0, despesas: 0 }]));
  for (const l of lancamentos) {
    if (!operacional(l)) continue;
    const item = mapa.get(l.data.slice(0, 7));
    if (!item) continue;
    if (l.valor >= 0) item.receitas += l.valor;
    else item.despesas -= l.valor;
  }
  return [...mapa.values()];
}

export interface Grupo {
  nome: string;
  receitas: number;
  despesas: number;
  saldo: number;
  quantidade: number;
}

export type Dimensao = "pessoa" | "plano" | "centro" | "grupo";

export function agrupar(lancamentos: Lancamento[], dimensao: Dimensao, de: string, ate: string): Grupo[] {
  const mapa = new Map<string, Grupo>();
  for (const l of lancamentos) {
    if (!operacional(l) || !dentro(l.data, de, ate)) continue;
    const bruto = dimensao === "grupo" ? l.plano.split(":")[0] : l[dimensao];
    const nome = bruto || "(sem classificação)";
    const g = mapa.get(nome) ?? { nome, receitas: 0, despesas: 0, saldo: 0, quantidade: 0 };
    if (l.valor >= 0) g.receitas += l.valor;
    else g.despesas -= l.valor;
    g.saldo += l.valor;
    g.quantidade += 1;
    mapa.set(nome, g);
  }
  return [...mapa.values()];
}

export function saldosPorConta(lancamentos: Lancamento[], hoje: string) {
  const mapa = new Map<string, number>();
  for (const l of lancamentos) {
    if (l.data > hoje) continue;
    mapa.set(l.conta, (mapa.get(l.conta) ?? 0) + l.valor);
  }
  return [...mapa.entries()]
    .map(([conta, saldo]) => ({ conta, saldo: Math.round(saldo * 100) / 100 }))
    .sort((a, b) => b.saldo - a.saldo);
}

export const FAIXAS = [
  { id: "vencidas", rotulo: "Vencidas" },
  { id: "hoje", rotulo: "Vencem hoje" },
  { id: "7dias", rotulo: "Próximos 7 dias" },
  { id: "30dias", rotulo: "De 8 a 30 dias" },
  { id: "depois", rotulo: "Depois de 30 dias" },
] as const;
export type FaixaId = (typeof FAIXAS)[number]["id"];

export function faixaDe(vencimento: string, hoje: string): FaixaId {
  const dias = diasEntre(hoje, vencimento);
  if (dias < 0) return "vencidas";
  if (dias === 0) return "hoje";
  if (dias <= 7) return "7dias";
  if (dias <= 30) return "30dias";
  return "depois";
}

export function porVencimento(programacoes: Programacao[], tipo: "pagar" | "receber", hoje: string) {
  const itens = programacoes
    .filter((p) => p.tipo === tipo && p.vencimento)
    .sort((a, b) => a.vencimento.localeCompare(b.vencimento));
  return FAIXAS.map((faixa) => {
    const daFaixa = itens.filter((p) => faixaDe(p.vencimento, hoje) === faixa.id);
    return { ...faixa, itens: daFaixa, total: daFaixa.reduce((s, p) => s + p.valor, 0) };
  });
}
