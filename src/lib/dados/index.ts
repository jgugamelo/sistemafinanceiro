import type { Repositorio } from "../types";
import { repositorioLocal } from "./local";
import { repositorioSupabase } from "./supabase";

const VALIDADE_MS = 5 * 60 * 1000;
const memoria = new Map<string, { quando: number; valor: Promise<unknown> }>();

/** Guarda cada tabela em memória por 5 minutos: evita reler o banco inteiro a cada tela. */
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

export function limparCache() {
  memoria.clear();
}

function fonte(): Repositorio {
  const escolha = process.env.DADOS || (process.env.SUPABASE_URL ? "supabase" : "local");
  return escolha === "supabase" ? repositorioSupabase : repositorioLocal;
}

export const dados: Repositorio = {
  lancamentos: () => comCache("lancamentos", () => fonte().lancamentos()),
  programacoes: () => comCache("programacoes", () => fonte().programacoes()),
  pessoas: () => comCache("pessoas", () => fonte().pessoas()),
};
