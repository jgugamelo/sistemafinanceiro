"use server";

import { revalidatePath } from "next/cache";
import { dados } from "@/lib/dados";
import { proximoVencimento } from "@/lib/frequencia";
import type { Lancamento, Pessoa, Programacao, Sem, TipoLista } from "@/lib/types";

export interface Resultado {
  ok: boolean;
  mensagem?: string;
  erro?: string;
  /** Muda a cada envio, para o formulário saber que há uma resposta nova. */
  vez?: number;
}

const campo = (f: FormData, nome: string) => String(f.get(nome) ?? "").replace(/\s+/g, " ").trim();

/** Aceita "1.234,56", "1234,56" e "1234.56". */
function valorDe(f: FormData, nome = "valor") {
  const bruto = campo(f, nome).replace(/[R$\s]/g, "");
  if (!bruto) return NaN;
  const normal = bruto.includes(",") ? bruto.replace(/\./g, "").replace(",", ".") : bruto;
  return Math.round(Number(normal) * 100) / 100;
}

const dataValida = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

class Invalido extends Error {}
function exigir(condicao: unknown, mensagem: string): asserts condicao {
  if (!condicao) throw new Invalido(mensagem);
}

async function executar(fazer: () => Promise<string>): Promise<Resultado> {
  try {
    const mensagem = await fazer();
    revalidatePath("/", "layout");
    return { ok: true, mensagem, vez: Date.now() };
  } catch (e) {
    const erro = e instanceof Invalido ? e.message : `Não foi possível salvar. ${e instanceof Error ? e.message : ""}`.trim();
    if (!(e instanceof Invalido)) console.error(e);
    return { ok: false, erro, vez: Date.now() };
  }
}

// ---------------- lançamentos ----------------

export async function salvarLancamento(_: Resultado, f: FormData): Promise<Resultado> {
  return executar(async () => {
    const id = campo(f, "id");
    const tipo = campo(f, "tipo") as Lancamento["tipo"];
    const valor = valorDe(f);
    const data = campo(f, "data");
    const conta = campo(f, "conta");
    exigir(["receita", "despesa", "transferencia"].includes(tipo), "Escolha receita, despesa ou transferência.");
    exigir(valor > 0, "Informe um valor maior que zero.");
    exigir(dataValida(data), "Informe a data.");
    exigir(conta, "Escolha a conta.");

    const historico = campo(f, "historico");
    const competencia = dataValida(campo(f, "competencia")) ? campo(f, "competencia") : data;

    if (tipo === "transferencia" && !id) {
      const destino = campo(f, "destino");
      exigir(destino, "Escolha a conta de destino.");
      exigir(destino !== conta, "A conta de destino precisa ser diferente da de origem.");
      const base = { data, tipo, plano: "", centro: "", historico, competencia };
      await dados.inserirLancamentos([
        { ...base, conta, pessoa: `[Para: ${destino}]`, valor: -valor },
        { ...base, conta: destino, pessoa: `[De: ${conta}]`, valor },
      ]);
      return "Transferência registrada";
    }

    const registro: Sem<Lancamento> = {
      conta,
      data,
      tipo,
      pessoa: campo(f, "pessoa"),
      plano: tipo === "transferencia" ? "" : campo(f, "plano"),
      centro: tipo === "transferencia" ? "" : campo(f, "centro"),
      historico,
      competencia,
      valor: tipo === "receita" ? valor : tipo === "despesa" ? -valor : campo(f, "sentido") === "entrada" ? valor : -valor,
    };
    if (id) {
      await dados.atualizarLancamento(id, registro);
      return "Lançamento atualizado";
    }
    await dados.inserirLancamentos([registro]);
    return tipo === "receita" ? "Receita registrada" : "Despesa registrada";
  });
}

export async function excluirLancamento(_: Resultado, f: FormData): Promise<Resultado> {
  return executar(async () => {
    const id = campo(f, "id");
    exigir(id, "Lançamento não encontrado.");
    await dados.excluirLancamento(id);
    return "Lançamento excluído";
  });
}

// ---------------- contas a pagar e a receber ----------------

export async function salvarProgramacao(_: Resultado, f: FormData): Promise<Resultado> {
  return executar(async () => {
    const id = campo(f, "id");
    const tipo = campo(f, "tipo") as Programacao["tipo"];
    const valor = valorDe(f);
    const vencimento = campo(f, "vencimento");
    const frequencia = campo(f, "frequencia") || "Uma única vez";
    exigir(tipo === "pagar" || tipo === "receber", "Escolha a pagar ou a receber.");
    exigir(campo(f, "pessoa") || campo(f, "historico"), "Informe para quem é a conta ou uma descrição.");
    exigir(valor > 0, "Informe um valor maior que zero.");
    exigir(dataValida(vencimento), "Informe o vencimento.");

    const unica = frequencia === "Uma única vez";
    const parcelas = unica ? 1 : Number(campo(f, "parcelas")) || 0;
    exigir(parcelas >= 0 && parcelas <= 600, "Número de parcelas inválido.");
    const restantes = unica ? 1 : parcelas > 0 ? parcelas : null;

    const registro: Sem<Programacao> = {
      tipo,
      conta: campo(f, "conta"),
      parcela: campo(f, "parcela"),
      pessoa: campo(f, "pessoa"),
      plano: campo(f, "plano"),
      centro: campo(f, "centro"),
      historico: campo(f, "historico"),
      vencimento,
      frequencia,
      valor,
      total: restantes ? Math.round(valor * restantes * 100) / 100 : valor,
      restantes,
    };
    if (id) {
      await dados.atualizarProgramacao(id, registro);
      return "Conta atualizada";
    }
    await dados.inserirProgramacao(registro);
    return tipo === "pagar" ? "Conta a pagar criada" : "Conta a receber criada";
  });
}

export async function excluirProgramacao(_: Resultado, f: FormData): Promise<Resultado> {
  return executar(async () => {
    const id = campo(f, "id");
    exigir(id, "Conta não encontrada.");
    await dados.excluirProgramacao(id);
    return "Conta excluída";
  });
}

/** Paga ou recebe a parcela: cria o lançamento e avança para a próxima, ou encerra a conta. */
export async function baixarProgramacao(_: Resultado, f: FormData): Promise<Resultado> {
  return executar(async () => {
    const id = campo(f, "id");
    const p = (await dados.programacoes()).find((x) => x.id === id);
    exigir(p, "Conta não encontrada. Atualize a página.");
    const valor = valorDe(f);
    const data = campo(f, "data");
    const conta = campo(f, "conta");
    exigir(valor > 0, "Informe o valor pago.");
    exigir(dataValida(data), "Informe a data do pagamento.");
    exigir(conta, "Escolha a conta de onde saiu ou para onde entrou o dinheiro.");

    await dados.inserirLancamentos([
      {
        conta,
        data,
        tipo: p.tipo === "pagar" ? "despesa" : "receita",
        pessoa: p.pessoa,
        plano: p.plano === "(Parcelado)" ? "" : p.plano,
        centro: p.centro,
        historico: p.historico || (p.parcela ? `Parcela ${p.parcela}` : ""),
        valor: p.tipo === "pagar" ? -valor : valor,
        competencia: p.vencimento,
      },
    ]);

    const proximo = proximoVencimento(p.vencimento, p.frequencia);
    const acabou = !proximo || p.restantes === 1 || p.restantes === 0;
    if (acabou) {
      await dados.excluirProgramacao(p.id);
    } else {
      const restantes = p.restantes == null ? null : p.restantes - 1;
      await dados.atualizarProgramacao(p.id, {
        ...p,
        vencimento: proximo,
        restantes,
        total: restantes == null ? p.total : Math.max(Math.round((p.total - p.valor) * 100) / 100, p.valor),
      });
    }
    const verbo = p.tipo === "pagar" ? "Pagamento registrado" : "Recebimento registrado";
    return acabou ? `${verbo}. Conta encerrada.` : `${verbo}. Próximo vencimento em ${proximo!.split("-").reverse().join("/")}.`;
  });
}

// ---------------- cadastros ----------------

export async function salvarPessoa(_: Resultado, f: FormData): Promise<Resultado> {
  return executar(async () => {
    const id = campo(f, "id");
    const nome = campo(f, "nome");
    const tipo = campo(f, "tipo") as Pessoa["tipo"];
    exigir(nome, "Informe o nome.");
    exigir(tipo === "cliente" || tipo === "fornecedor", "Escolha cliente ou fornecedor.");
    const registro: Sem<Pessoa> = {
      tipo,
      nome,
      razao: campo(f, "razao"),
      pessoa: campo(f, "pessoa") === "PJ" ? "PJ" : "PF",
      documento: campo(f, "documento"),
      email: campo(f, "email"),
      telefone: campo(f, "telefone"),
      cidade: campo(f, "cidade"),
      uf: campo(f, "uf").toUpperCase().slice(0, 2),
      inativo: f.get("inativo") ? "sim" : "",
    };
    if (id) {
      await dados.atualizarPessoa(id, registro);
      return "Cadastro atualizado";
    }
    await dados.inserirPessoa(registro);
    return tipo === "cliente" ? "Cliente cadastrado" : "Fornecedor cadastrado";
  });
}

export async function excluirPessoa(_: Resultado, f: FormData): Promise<Resultado> {
  return executar(async () => {
    const id = campo(f, "id");
    exigir(id, "Cadastro não encontrado.");
    await dados.excluirPessoa(id);
    return "Cadastro excluído";
  });
}

export async function salvarItemLista(_: Resultado, f: FormData): Promise<Resultado> {
  return executar(async () => {
    const tipo = campo(f, "tipo") as TipoLista;
    const nome = campo(f, "nome");
    exigir(["conta", "plano", "centro"].includes(tipo), "Tipo inválido.");
    exigir(nome, "Informe o nome.");
    const ativo = campo(f, "ativo") !== "nao";
    await dados.salvarItemLista({ tipo, nome, ativo });
    const nomeTipo = { conta: "Conta", plano: "Plano de contas", centro: "Centro de custo" }[tipo];
    const a = tipo === "conta" ? "a" : "o";
    return campo(f, "acao") === "alternar" ? `${nomeTipo} ${ativo ? "reativad" : "desativad"}${a}` : `${nomeTipo} adicionad${a}`;
  });
}
