"use client";

import { useCallback, useState } from "react";
import { FormLancamento } from "./formularios/FormLancamento";
import { FormPessoa } from "./formularios/FormPessoa";
import { FormBaixa, FormProgramacao } from "./formularios/FormProgramacao";
import { Icone } from "./ui/Icone";
import { Modal } from "./ui/Modal";
import type { Opcoes } from "@/lib/opcoes";
import type { Lancamento, Pessoa, Programacao } from "@/lib/types";

function useAberto() {
  const [aberto, setAberto] = useState(false);
  const fechar = useCallback(() => setAberto(false), []);
  return { aberto, abrir: () => setAberto(true), fechar };
}

/** Linha clicável que abre o formulário de edição. O conteúdo vem pronto do servidor. */
function LinhaClicavel({ abrir, rotulo, children, className = "" }: { abrir: () => void; rotulo: string; children: React.ReactNode; className?: string }) {
  return (
    <button type="button" onClick={abrir} aria-label={rotulo} className={`block w-full text-left transition-colors hover:bg-cedula-nevoa/70 focus-visible:bg-cedula-nevoa ${className}`}>
      {children}
    </button>
  );
}

export function NovoLancamento({ opcoes, variante = "botao" }: { opcoes: Opcoes; variante?: "botao" | "flutuante" }) {
  const { aberto, abrir, fechar } = useAberto();
  return (
    <>
      {variante === "flutuante" ? (
        <button
          type="button"
          onClick={abrir}
          aria-label="Novo lançamento"
          className="fixed bottom-[calc(80px+env(safe-area-inset-bottom))] right-4 z-30 grid h-14 w-14 place-items-center rounded-2xl bg-cedula text-white shadow-flutuante transition-transform active:scale-95 lg:hidden"
        >
          <Icone nome="mais" className="h-6 w-6" />
        </button>
      ) : (
        <button type="button" onClick={abrir} className="botao-principal">
          <Icone nome="mais" className="h-4 w-4" />
          Novo lançamento
        </button>
      )}
      <Modal aberto={aberto} aoFechar={fechar} titulo="Novo lançamento">
        <FormLancamento opcoes={opcoes} aoConcluir={fechar} />
      </Modal>
    </>
  );
}

export function EditarLancamento({ opcoes, lancamento, children }: { opcoes: Opcoes; lancamento: Lancamento; children: React.ReactNode }) {
  const { aberto, abrir, fechar } = useAberto();
  return (
    <>
      <LinhaClicavel abrir={abrir} rotulo={`Editar lançamento de ${lancamento.pessoa || lancamento.conta}`}>
        {children}
      </LinhaClicavel>
      <Modal aberto={aberto} aoFechar={fechar} titulo={lancamento.tipo === "transferencia" ? "Transferência" : lancamento.tipo === "receita" ? "Receita" : "Despesa"}>
        <FormLancamento opcoes={opcoes} inicial={lancamento} aoConcluir={fechar} />
      </Modal>
    </>
  );
}

export function NovaProgramacao({ opcoes, tipo }: { opcoes: Opcoes; tipo: Programacao["tipo"] }) {
  const { aberto, abrir, fechar } = useAberto();
  return (
    <>
      <button type="button" onClick={abrir} className="botao-principal">
        <Icone nome="mais" className="h-4 w-4" />
        {tipo === "pagar" ? "Nova conta a pagar" : "Nova conta a receber"}
      </button>
      <Modal aberto={aberto} aoFechar={fechar} titulo={tipo === "pagar" ? "Nova conta a pagar" : "Nova conta a receber"}>
        <FormProgramacao opcoes={opcoes} tipoInicial={tipo} aoConcluir={fechar} />
      </Modal>
    </>
  );
}

export function EditarProgramacao({ opcoes, conta, children }: { opcoes: Opcoes; conta: Programacao; children: React.ReactNode }) {
  const { aberto, abrir, fechar } = useAberto();
  return (
    <>
      <LinhaClicavel abrir={abrir} rotulo={`Editar conta de ${conta.pessoa || conta.historico}`} className="min-w-0 flex-1 rounded-xl">
        {children}
      </LinhaClicavel>
      <Modal aberto={aberto} aoFechar={fechar} titulo={conta.tipo === "pagar" ? "Conta a pagar" : "Conta a receber"}>
        <FormProgramacao opcoes={opcoes} inicial={conta} aoConcluir={fechar} />
      </Modal>
    </>
  );
}

export function BaixarProgramacao({ opcoes, conta }: { opcoes: Opcoes; conta: Programacao }) {
  const { aberto, abrir, fechar } = useAberto();
  const pagar = conta.tipo === "pagar";
  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className={`botao min-h-[38px] shrink-0 px-3 text-[13px] ${pagar ? "bg-saida-claro text-saida hover:bg-saida/15" : "bg-entrada-claro text-entrada hover:bg-entrada/15"}`}
      >
        <Icone nome="check" className="h-4 w-4" />
        {pagar ? "Pagar" : "Receber"}
      </button>
      <Modal aberto={aberto} aoFechar={fechar} titulo={pagar ? "Registrar pagamento" : "Registrar recebimento"}>
        <FormBaixa opcoes={opcoes} conta={conta} aoConcluir={fechar} />
      </Modal>
    </>
  );
}

export function NovaPessoa() {
  const { aberto, abrir, fechar } = useAberto();
  return (
    <>
      <button type="button" onClick={abrir} className="botao-principal">
        <Icone nome="mais" className="h-4 w-4" />
        Novo cadastro
      </button>
      <Modal aberto={aberto} aoFechar={fechar} titulo="Novo cliente ou fornecedor">
        <FormPessoa aoConcluir={fechar} />
      </Modal>
    </>
  );
}

export function EditarPessoa({ pessoa, children }: { pessoa: Pessoa; children: React.ReactNode }) {
  const { aberto, abrir, fechar } = useAberto();
  return (
    <>
      <LinhaClicavel abrir={abrir} rotulo={`Editar ${pessoa.nome}`} className="rounded-xl">
        {children}
      </LinhaClicavel>
      <Modal aberto={aberto} aoFechar={fechar} titulo={pessoa.nome}>
        <FormPessoa inicial={pessoa} aoConcluir={fechar} />
      </Modal>
    </>
  );
}
