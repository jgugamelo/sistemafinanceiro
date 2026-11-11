import { promises as fs } from "node:fs";
import path from "node:path";
import type { ItemLista, Lancamento, Pessoa, Programacao, Repositorio, Sem } from "../types";

/** Lê e grava data/*.json. Só para testes no próprio computador: na Vercel o disco é somente leitura. */

const arquivo = (nome: string) => path.join(process.cwd(), "data", `${nome}.json`);

async function ler<T>(nome: string): Promise<T[]> {
  try {
    return JSON.parse(await fs.readFile(arquivo(nome), "utf8")) as T[];
  } catch {
    return [];
  }
}

async function gravar<T>(nome: string, linhas: T[]) {
  await fs.mkdir(path.dirname(arquivo(nome)), { recursive: true });
  await fs.writeFile(arquivo(nome), JSON.stringify(linhas));
}

const novoId = (prefixo: string) => `${prefixo}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function tabela<T extends { id: string }>(nome: string, prefixo: string) {
  return {
    ler: () => ler<T>(nome),
    async inserir(novos: Sem<T>[]) {
      const linhas = await ler<T>(nome);
      await gravar(nome, [...linhas, ...novos.map((n) => ({ ...n, id: novoId(prefixo) }) as T)]);
    },
    async atualizar(id: string, dados: Sem<T>) {
      const linhas = await ler<T>(nome);
      await gravar(nome, linhas.map((l) => (l.id === id ? ({ ...dados, id } as T) : l)));
    },
    async excluir(id: string) {
      const linhas = await ler<T>(nome);
      await gravar(nome, linhas.filter((l) => l.id !== id));
    },
  };
}

const lancamentos = tabela<Lancamento>("lancamentos", "L");
const programacoes = tabela<Programacao>("programacoes", "P");
const pessoas = tabela<Pessoa>("pessoas", "C");
const listas = tabela<ItemLista>("listas", "T");

export const repositorioLocal: Repositorio = {
  lancamentos: lancamentos.ler,
  programacoes: async () => (await programacoes.ler()).map((p) => ({ ...p, restantes: p.restantes ?? null })),
  pessoas: pessoas.ler,
  listas: listas.ler,

  inserirLancamentos: lancamentos.inserir,
  atualizarLancamento: lancamentos.atualizar,
  excluirLancamento: lancamentos.excluir,

  inserirProgramacao: (n) => programacoes.inserir([n]),
  atualizarProgramacao: programacoes.atualizar,
  excluirProgramacao: programacoes.excluir,

  inserirPessoa: (n) => pessoas.inserir([n]),
  atualizarPessoa: pessoas.atualizar,
  excluirPessoa: pessoas.excluir,

  async salvarItemLista(item) {
    const todos = await listas.ler();
    const existente = todos.find((t) => t.tipo === item.tipo && t.nome === item.nome);
    if (existente) await listas.atualizar(existente.id, item);
    else await listas.inserir([item]);
  },
};
