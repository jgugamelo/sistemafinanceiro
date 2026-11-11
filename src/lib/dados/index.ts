import type { Repositorio } from "../types";
import { repositorioLocal } from "./local";
import { repositorioSupabase } from "./supabase";

/**
 * Cache curto em memória: as telas leem as tabelas inteiras e isso evita reler o banco a cada clique.
 * Toda gravação feita pelo app limpa o cache na hora.
 */
const VALIDADE_MS = 60 * 1000;
// Fica em globalThis porque o Next carrega este módulo mais de uma vez (páginas e ações do servidor):
// assim a gravação limpa o mesmo cache que as páginas leem.
type Cache = Map<string, { quando: number; valor: Promise<unknown> }>;
const global = globalThis as unknown as { __cacheFinanceiro?: Cache };
const memoria: Cache = (global.__cacheFinanceiro ??= new Map());

function comCache<T>(chave: string, buscar: () => Promise<T>): Promise<T> {
  const agora = Date.now();
  const guardado = memoria.get(chave);
  if (guardado && agora - guardado.quando < VALIDADE_MS) return guardado.valor as Promise<T>;
  const valor = buscar().catch((erro) => {
    memoria.delete(chave);
    throw erro;
  });
  memoria.set(chave, { quando: agora, valor });
  return valor;
}

function fonte(): Repositorio {
  const escolha = process.env.DADOS || (process.env.SUPABASE_URL ? "supabase" : "local");
  return escolha === "supabase" ? repositorioSupabase : repositorioLocal;
}

function gravacao<A extends unknown[]>(fazer: (r: Repositorio, ...a: A) => Promise<void>) {
  return async (...a: A) => {
    try {
      await fazer(fonte(), ...a);
    } finally {
      memoria.clear();
    }
  };
}

export const dados: Repositorio = {
  lancamentos: () => comCache("lancamentos", () => fonte().lancamentos()),
  programacoes: () => comCache("programacoes", () => fonte().programacoes()),
  pessoas: () => comCache("pessoas", () => fonte().pessoas()),
  listas: () => comCache("listas", () => fonte().listas()),

  inserirLancamentos: gravacao((r, n) => r.inserirLancamentos(n)),
  atualizarLancamento: gravacao((r, id, d) => r.atualizarLancamento(id, d)),
  excluirLancamento: gravacao((r, id) => r.excluirLancamento(id)),

  inserirProgramacao: gravacao((r, n) => r.inserirProgramacao(n)),
  atualizarProgramacao: gravacao((r, id, d) => r.atualizarProgramacao(id, d)),
  excluirProgramacao: gravacao((r, id) => r.excluirProgramacao(id)),

  inserirPessoa: gravacao((r, n) => r.inserirPessoa(n)),
  atualizarPessoa: gravacao((r, id, d) => r.atualizarPessoa(id, d)),
  excluirPessoa: gravacao((r, id) => r.excluirPessoa(id)),

  salvarItemLista: gravacao((r, i) => r.salvarItemLista(i)),
};
