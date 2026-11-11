import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Lancamento, Pessoa, Programacao, Repositorio } from "../types";

let cliente: SupabaseClient | null = null;

/** Cliente com a chave de serviço: só roda no servidor, nunca vai para o navegador. */
function banco() {
  const url = process.env.SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) {
    throw new Error("Supabase não configurado: defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
  }
  cliente ??= createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } });
  return cliente;
}

const PAGINA = 1000; // limite padrão de linhas por consulta no Supabase

/** Lê a tabela inteira, buscando as páginas de 1000 linhas em paralelo. */
async function lerTudo(tabela: string, ordem: string): Promise<Record<string, unknown>[]> {
  const pagina = (inicio: number) =>
    banco().from(tabela).select("*", inicio === 0 ? { count: "exact" } : undefined).order(ordem).order("id").range(inicio, inicio + PAGINA - 1);

  const primeira = await pagina(0);
  if (primeira.error) throw new Error(`Supabase (${tabela}): ${primeira.error.message}`);
  const total = primeira.count ?? primeira.data.length;
  const inicios: number[] = [];
  for (let i = PAGINA; i < total; i += PAGINA) inicios.push(i);
  const demais = await Promise.all(inicios.map(pagina));
  const linhas = [...primeira.data];
  for (const r of demais) {
    if (r.error) throw new Error(`Supabase (${tabela}): ${r.error.message}`);
    linhas.push(...r.data);
  }
  return linhas;
}

const texto = (v: unknown) => (v == null ? "" : String(v));

export const repositorioSupabase: Repositorio = {
  async lancamentos() {
    return (await lerTudo("fin_lancamentos", "data")).map(
      (l): Lancamento => ({
        id: texto(l.id),
        conta: texto(l.conta),
        data: texto(l.data),
        tipo: l.tipo as Lancamento["tipo"],
        pessoa: texto(l.pessoa),
        plano: texto(l.plano),
        centro: texto(l.centro),
        historico: texto(l.historico),
        valor: Number(l.valor) || 0,
        competencia: texto(l.competencia) || texto(l.data),
      }),
    );
  },
  async programacoes() {
    return (await lerTudo("fin_programacoes", "vencimento")).map(
      (p): Programacao => ({
        id: texto(p.id),
        tipo: p.tipo as Programacao["tipo"],
        conta: texto(p.conta),
        parcela: texto(p.parcela),
        pessoa: texto(p.pessoa),
        plano: texto(p.plano),
        centro: texto(p.centro),
        historico: texto(p.historico),
        vencimento: texto(p.vencimento),
        frequencia: texto(p.frequencia),
        valor: Number(p.valor) || 0,
        total: Number(p.total) || 0,
      }),
    );
  },
  async pessoas() {
    return (await lerTudo("fin_pessoas", "nome")).map(
      (p): Pessoa => ({
        id: texto(p.id),
        tipo: p.tipo as Pessoa["tipo"],
        nome: texto(p.nome),
        razao: texto(p.razao),
        pessoa: p.pessoa === "PJ" ? "PJ" : "PF",
        documento: texto(p.documento),
        email: texto(p.email),
        telefone: texto(p.telefone),
        cidade: texto(p.cidade),
        uf: texto(p.uf),
        inativo: p.inativo ? "sim" : "",
      }),
    );
  },
};
