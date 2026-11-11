"use client";

import { useRef } from "react";
import { salvarItemLista } from "@/app/acoes";
import { BotaoEnviar, Erro, useEnvio } from "@/components/ui/Formulario";
import type { TipoLista } from "@/lib/types";

const NOMES: Record<TipoLista, { rotulo: string; exemplo: string }> = {
  conta: { rotulo: "Nova conta", exemplo: "Ex.: Itaú Empresa" },
  plano: { rotulo: "Novo plano de contas", exemplo: "Ex.: ADMINISTRATIVO:Seguros" },
  centro: { rotulo: "Novo centro de custo", exemplo: "Ex.: Polo Madureira" },
};

export function AdicionarItem({ tipo }: { tipo: TipoLista }) {
  const formulario = useRef<HTMLFormElement>(null);
  const { estado, enviar } = useEnvio(salvarItemLista, () => formulario.current?.reset());
  return (
    <form ref={formulario} action={enviar} className="flex flex-col gap-2">
      <input type="hidden" name="tipo" value={tipo} />
      <label htmlFor={`novo-${tipo}`} className="text-[13px] font-semibold text-tinta-suave">
        {NOMES[tipo].rotulo}
      </label>
      <div className="flex gap-2">
        <input id={`novo-${tipo}`} name="nome" required placeholder={NOMES[tipo].exemplo} autoComplete="off" className="campo" />
        <BotaoEnviar className="botao-principal shrink-0">Adicionar</BotaoEnviar>
      </div>
      {tipo === "plano" && <p className="text-xs text-tinta-fraca">Use dois-pontos para criar um subitem: GRUPO:Subitem.</p>}
      <Erro estado={estado} />
    </form>
  );
}

export function AlternarItem({ tipo, nome, ativo }: { tipo: TipoLista; nome: string; ativo: boolean }) {
  const { estado, enviar } = useEnvio(salvarItemLista);
  return (
    <form action={enviar} title={estado.erro}>
      <input type="hidden" name="tipo" value={tipo} />
      <input type="hidden" name="nome" value={nome} />
      <input type="hidden" name="acao" value="alternar" />
      <input type="hidden" name="ativo" value={ativo ? "nao" : "sim"} />
      <BotaoEnviar
        className={`botao min-h-[34px] rounded-lg px-3 text-xs ${ativo ? "text-tinta-suave hover:bg-fundo" : "bg-cedula-claro text-cedula hover:bg-cedula-claro/70"}`}
        aria-label={`${ativo ? "Desativar" : "Reativar"} ${nome}`}
      >
        {ativo ? "Desativar" : "Reativar"}
      </BotaoEnviar>
    </form>
  );
}
