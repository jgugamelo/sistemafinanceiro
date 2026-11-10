export type TipoLancamento = "receita" | "despesa" | "transferencia";

export interface Lancamento {
  id: string;
  conta: string;
  data: string; // AAAA-MM-DD
  tipo: TipoLancamento;
  pessoa: string;
  plano: string; // "Grupo:Subgrupo"
  centro: string;
  historico: string;
  valor: number; // positivo = entrada, negativo = saída
  competencia: string;
}

export interface Programacao {
  id: string;
  tipo: "pagar" | "receber";
  conta: string;
  parcela: string;
  pessoa: string;
  plano: string;
  centro: string;
  historico: string;
  vencimento: string;
  frequencia: string;
  valor: number; // valor da próxima parcela
  total: number;
}

export interface Pessoa {
  id: string;
  tipo: "cliente" | "fornecedor";
  nome: string;
  razao: string;
  pessoa: "PF" | "PJ";
  documento: string;
  email: string;
  telefone: string;
  cidade: string;
  uf: string;
  inativo: string;
}

/** Contrato da fonte de dados. Trocar de Google Sheets para Postgres é escrever outra implementação disto. */
export interface Repositorio {
  lancamentos(): Promise<Lancamento[]>;
  programacoes(): Promise<Programacao[]>;
  pessoas(): Promise<Pessoa[]>;
}
