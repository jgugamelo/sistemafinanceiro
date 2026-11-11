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
  restantes: number | null; // parcelas que faltam; null = recorrente sem fim
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

export type TipoLista = "conta" | "plano" | "centro";

/** Conta, plano de contas ou centro de custo cadastrado à mão. */
export interface ItemLista {
  id: string;
  tipo: TipoLista;
  nome: string;
  ativo: boolean;
}

export type Sem<T> = Omit<T, "id">;

/** Contrato da fonte de dados: arquivos locais (testes) ou Supabase. */
export interface Repositorio {
  lancamentos(): Promise<Lancamento[]>;
  programacoes(): Promise<Programacao[]>;
  pessoas(): Promise<Pessoa[]>;
  listas(): Promise<ItemLista[]>;

  inserirLancamentos(novos: Sem<Lancamento>[]): Promise<void>;
  atualizarLancamento(id: string, dados: Sem<Lancamento>): Promise<void>;
  excluirLancamento(id: string): Promise<void>;

  inserirProgramacao(nova: Sem<Programacao>): Promise<void>;
  atualizarProgramacao(id: string, dados: Sem<Programacao>): Promise<void>;
  excluirProgramacao(id: string): Promise<void>;

  inserirPessoa(nova: Sem<Pessoa>): Promise<void>;
  atualizarPessoa(id: string, dados: Sem<Pessoa>): Promise<void>;
  excluirPessoa(id: string): Promise<void>;

  /** Cria o item ou, se já existir com o mesmo tipo e nome, só ajusta o "ativo". */
  salvarItemLista(item: Sem<ItemLista>): Promise<void>;
}
