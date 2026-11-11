"use client";

import { useState } from "react";
import { excluirLancamento, salvarLancamento } from "@/app/acoes";
import { BotaoEnviar, Campo, CampoSugestoes, CampoValor, Erro, Segmentado, useEnvio } from "@/components/ui/Formulario";
import { hojeIso } from "@/lib/formato";
import type { Opcoes } from "@/lib/opcoes";
import type { Lancamento, TipoLancamento } from "@/lib/types";

export function FormLancamento({
  opcoes,
  inicial,
  aoConcluir,
}: {
  opcoes: Opcoes;
  inicial?: Lancamento;
  aoConcluir: () => void;
}) {
  const [tipo, setTipo] = useState<TipoLancamento>(inicial?.tipo ?? "despesa");
  const { estado, enviar } = useEnvio(salvarLancamento, aoConcluir);
  const exclusao = useEnvio(excluirLancamento, aoConcluir);
  const [confirmar, setConfirmar] = useState(false);
  const editando = Boolean(inicial);
  const transferencia = tipo === "transferencia";

  return (
    <>
      <form action={enviar} className="flex flex-col gap-4">
        {inicial && <input type="hidden" name="id" value={inicial.id} />}
        {editando && transferencia && <input type="hidden" name="sentido" value={inicial!.valor >= 0 ? "entrada" : "saida"} />}

        {editando ? (
          <input type="hidden" name="tipo" value={tipo} />
        ) : (
          <Segmentado
            rotulo="Tipo de lançamento"
            nome="tipo"
            valor={tipo}
            aoMudar={setTipo}
            opcoes={[
              { valor: "despesa", rotulo: "Despesa", tom: "text-saida" },
              { valor: "receita", rotulo: "Receita", tom: "text-entrada" },
              { valor: "transferencia", rotulo: "Transferência", tom: "text-cedula" },
            ]}
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          <CampoValor padrao={inicial ? Math.abs(inicial.valor) : undefined} />
          <Campo rotulo={tipo === "receita" ? "Recebido em" : tipo === "despesa" ? "Pago em" : "Data"}>
            {(id) => <input id={id} name="data" type="date" required defaultValue={inicial?.data ?? hojeIso()} className="campo" />}
          </Campo>
        </div>

        {transferencia && !editando ? (
          <div className="grid grid-cols-2 gap-3">
            <CampoSugestoes rotulo="Sai da conta" nome="conta" sugestoes={opcoes.contas} obrigatorio />
            <CampoSugestoes rotulo="Entra na conta" nome="destino" sugestoes={opcoes.contas} obrigatorio />
          </div>
        ) : (
          <>
            <CampoSugestoes rotulo="Conta" nome="conta" sugestoes={opcoes.contas} padrao={inicial?.conta} obrigatorio />
            <CampoSugestoes
              rotulo={tipo === "receita" ? "Recebido de" : tipo === "despesa" ? "Pago a" : "Descrição"}
              nome="pessoa"
              sugestoes={transferencia ? [] : opcoes.pessoas}
              padrao={inicial?.pessoa}
            />
          </>
        )}

        {!transferencia && (
          <div className="grid gap-3 sm:grid-cols-2">
            <CampoSugestoes rotulo="Plano de contas" nome="plano" sugestoes={opcoes.planos} padrao={inicial?.plano} placeholder="Ex.: ADMINISTRATIVO:Aluguel" />
            <CampoSugestoes rotulo="Centro de custo" nome="centro" sugestoes={opcoes.centros} padrao={inicial?.centro} />
          </div>
        )}

        <Campo rotulo="Observação">
          {(id) => <input id={id} name="historico" defaultValue={inicial?.historico} autoComplete="off" className="campo" />}
        </Campo>

        {!transferencia && (
          <Campo rotulo="Competência" dica="Mês a que o valor se refere, se for diferente da data.">
            {(id) => <input id={id} name="competencia" type="date" defaultValue={inicial?.competencia ?? ""} className="campo" />}
          </Campo>
        )}

        <Erro estado={estado} />

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
          {editando ? (
            <button type="button" className="botao-perigo" onClick={() => setConfirmar(true)}>
              Excluir lançamento
            </button>
          ) : (
            <span />
          )}
          <BotaoEnviar>{editando ? "Salvar alterações" : transferencia ? "Registrar transferência" : tipo === "receita" ? "Registrar receita" : "Registrar despesa"}</BotaoEnviar>
        </div>
      </form>

      {confirmar && inicial && (
        <form action={exclusao.enviar} className="mt-4 rounded-2xl border border-saida/30 bg-saida-claro p-4 text-sm">
          <input type="hidden" name="id" value={inicial.id} />
          <p className="font-semibold text-saida">Excluir este lançamento?</p>
          <p className="mt-1 text-tinta-suave">
            O saldo da conta muda na hora.{transferencia && " Numa transferência, o lançamento da outra conta continua lá e precisa ser excluído também."}
          </p>
          <Erro estado={exclusao.estado} />
          <div className="mt-3 flex gap-2">
            <BotaoEnviar className="botao bg-saida text-white hover:bg-saida/90">Excluir</BotaoEnviar>
            <button type="button" className="botao-secundario" onClick={() => setConfirmar(false)}>
              Manter
            </button>
          </div>
        </form>
      )}
    </>
  );
}
