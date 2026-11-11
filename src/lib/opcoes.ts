import { dados } from "./dados";
import type { TipoLista } from "./types";

export interface Opcoes {
  contas: string[];
  planos: string[];
  centros: string[];
  pessoas: string[];
}

export interface ItemCadastro {
  tipo: TipoLista;
  nome: string;
  ativo: boolean;
  usos: number;
  ultimoUso: string;
}

const ordenar = (a: string, b: string) => a.localeCompare(b, "pt-BR", { sensitivity: "base" });

/** Contas, planos e centros: os que aparecem nos dados mais os cadastrados à mão, com quantas vezes foram usados. */
export async function itensCadastro(): Promise<ItemCadastro[]> {
  const [lancamentos, programacoes, listas] = await Promise.all([dados.lancamentos(), dados.programacoes(), dados.listas()]);
  const mapa = new Map<string, ItemCadastro>();
  const tocar = (tipo: TipoLista, nome: string, data = "") => {
    if (!nome) return;
    const chave = `${tipo}|${nome}`;
    const item = mapa.get(chave) ?? { tipo, nome, ativo: true, usos: 0, ultimoUso: "" };
    item.usos += 1;
    if (data > item.ultimoUso) item.ultimoUso = data;
    mapa.set(chave, item);
  };
  for (const l of lancamentos) {
    tocar("conta", l.conta, l.data);
    tocar("plano", l.plano, l.data);
    tocar("centro", l.centro, l.data);
  }
  for (const p of programacoes) {
    tocar("conta", p.conta);
    tocar("plano", p.plano);
    tocar("centro", p.centro);
  }
  for (const t of listas) {
    const chave = `${t.tipo}|${t.nome}`;
    const item = mapa.get(chave) ?? { tipo: t.tipo, nome: t.nome, ativo: true, usos: 0, ultimoUso: "" };
    item.ativo = t.ativo;
    mapa.set(chave, item);
  }
  return [...mapa.values()].sort((a, b) => ordenar(a.nome, b.nome));
}

/** Sugestões para os campos dos formulários. Itens desativados ficam de fora. */
export async function opcoes(): Promise<Opcoes> {
  const [itens, pessoas, lancamentos] = await Promise.all([itensCadastro(), dados.pessoas(), dados.lancamentos()]);
  const ativos = (tipo: TipoLista) => itens.filter((i) => i.tipo === tipo && i.ativo && i.nome !== "(Parcelado)").map((i) => i.nome);

  const nomes = new Set(pessoas.filter((p) => !p.inativo).map((p) => p.nome));
  for (const l of lancamentos) if (l.tipo !== "transferencia" && l.pessoa && !l.pessoa.startsWith("[")) nomes.add(l.pessoa);

  return {
    contas: ativos("conta"),
    planos: ativos("plano"),
    centros: ativos("centro"),
    pessoas: [...nomes].sort(ordenar),
  };
}
