import { promises as fs } from "node:fs";
import path from "node:path";
import type { Lancamento, Pessoa, Programacao, Repositorio } from "../types";

async function ler<T>(nome: string): Promise<T[]> {
  try {
    const texto = await fs.readFile(path.join(process.cwd(), "data", `${nome}.json`), "utf8");
    return JSON.parse(texto) as T[];
  } catch {
    return [];
  }
}

/** Lê os arquivos gerados por `npm run importar`. Só para desenvolvimento no próprio computador. */
export const repositorioLocal: Repositorio = {
  lancamentos: () => ler<Lancamento>("lancamentos"),
  programacoes: () => ler<Programacao>("programacoes"),
  pessoas: () => ler<Pessoa>("pessoas"),
};
