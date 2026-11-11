"use client";

import { useState } from "react";
import { baixarProgramacao, excluirProgramacao, salvarProgramacao } from "@/app/acoes";
import { BotaoEnviar, Campo, CampoSugestoes, CampoValor, Erro, Segmentado, useEnvio } from "@/components/ui/Formulario";
import { brl, dataBr, hojeIso } from "@/lib/formato";
import { FREQUENCIAS } from "@/lib/frequencia";
import type { Opcoes } from "@/lib/opcoes";
import type { Programacao } from "@/lib/types";

export function FormProgramacao({
  opcoes,
  inicial,
  tipoInicial = "pagar",
  aoConcluir,
}: {
  opcoes: Opcoes;
  inicial?: Programacao;
  tipoInicial?: Programacao["tipo"];
  aoConcluir: () => void;
}) {
  const [tipo, setTipo] = useState<Programacao["tipo"]>(inicial?.tipo ?? tipoInicial);
  const [frequencia, setFrequencia] = useState(inicial?.frequencia || "Uma única vez");
  const { estado, enviar } = useEnvio(salvarProgramacao, aoConcluir);
  const exclusao = useEnvio(excluirProgramacao, aoConcluir);
  const [confirmar, setConfirmar] = useState(false);
  const unica = frequencia === "Uma única vez";

  return (
    <>
      <form action={enviar} className="flex flex-col gap-4">
        {inicial && <input type="hidden" name="id" value={inicial.id} />}
        {inicial && <input type="hidden" name="parcela" value={inicial.parcela} />}
        <Segmentado
          rotulo="A pagar ou a receber"
          nome="tipo"
          valor={tipo}
          aoMudar={setTipo}
          opcoes={[
            { valor: "pagar", rotulo: "A pagar", tom: "text-saida" },
            { valor: "receber", rotulo: "A receber", tom: "text-entrada" },
          ]}
        />

        <CampoSugestoes rotulo={tipo === "pagar" ? "Pagar a" : "Receber de"} nome="pessoa" sugestoes={opcoes.pessoas} padrao={inicial?.pessoa} />

        <div className="grid grid-cols-2 gap-3">
          <CampoValor padrao={inicial?.valor} rotulo={unica ? "Valor" : "Valor de cada parcela"} />
          <Campo rotulo={inicial ? "Próximo vencimento" : "Vencimento"}>
            {(id) => <input id={id} name="vencimento" type="date" required defaultValue={inicial?.vencimento ?? hojeIso()} className="campo" />}
          </Campo>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Repetição">
            {(id) => (
              <select id={id} name="frequencia" value={frequencia} onChange={(e) => setFrequencia(e.target.value)} className="campo">
                {FREQUENCIAS.map((f) => (
                  <option key={f}>{f}</option>
                ))}
                {inicial?.frequencia && !FREQUENCIAS.includes(inicial.frequencia as never) && <option>{inicial.frequencia}</option>}
              </select>
            )}
          </Campo>
          {!unica && (
            <Campo rotulo="Parcelas restantes" dica="Em branco: repete sem data para acabar.">
              {(id) => (
                <input id={id} name="parcelas" type="number" min={1} max={600} inputMode="numeric" defaultValue={inicial?.restantes ?? ""} className="campo" />
              )}
            </Campo>
          )}
        </div>

        <CampoSugestoes rotulo={tipo === "pagar" ? "Pagar pela conta" : "Receber na conta"} nome="conta" sugestoes={opcoes.contas} padrao={inicial?.conta} />

        <div className="grid gap-3 sm:grid-cols-2">
          <CampoSugestoes rotulo="Plano de contas" nome="plano" sugestoes={opcoes.planos} padrao={inicial?.plano} />
          <CampoSugestoes rotulo="Centro de custo" nome="centro" sugestoes={opcoes.centros} padrao={inicial?.centro} />
        </div>

        <Campo rotulo="Observação">
          {(id) => <input id={id} name="historico" defaultValue={inicial?.historico} autoComplete="off" className="campo" />}
        </Campo>

        <Erro estado={estado} />

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
          {inicial ? (
            <button type="button" className="botao-perigo" onClick={() => setConfirmar(true)}>
              Excluir conta
            </button>
          ) : (
            <span />
          )}
          <BotaoEnviar>{inicial ? "Salvar alterações" : tipo === "pagar" ? "Criar conta a pagar" : "Criar conta a receber"}</BotaoEnviar>
        </div>
      </form>

      {confirmar && inicial && (
        <form action={exclusao.enviar} className="mt-4 rounded-2xl border border-saida/30 bg-saida-claro p-4 text-sm">
          <input type="hidden" name="id" value={inicial.id} />
          <p className="font-semibold text-saida">Excluir esta conta {inicial.tipo === "pagar" ? "a pagar" : "a receber"}?</p>
          <p className="mt-1 text-tinta-suave">As próximas parcelas deixam de aparecer. Os pagamentos já feitos continuam nos lançamentos.</p>
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

/** Confirma o pagamento ou recebimento de uma parcela. */
export function FormBaixa({ opcoes, conta, aoConcluir }: { opcoes: Opcoes; conta: Programacao; aoConcluir: () => void }) {
  const { estado, enviar } = useEnvio(baixarProgramacao, aoConcluir);
  const pagar = conta.tipo === "pagar";
  const ultima = conta.frequencia === "Uma única vez" || conta.restantes === 1;

  return (
    <form action={enviar} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={conta.id} />
      <div className="rounded-2xl bg-fundo p-4">
        <p className="font-semibold">{conta.pessoa || conta.historico || "Sem nome"}</p>
        <p className="mt-0.5 text-sm text-tinta-suave">
          Vencimento {dataBr(conta.vencimento)}, {brl(conta.valor)}
          {conta.restantes ? `, ${conta.restantes === 1 ? "última parcela" : `${conta.restantes} parcelas restantes`}` : conta.frequencia !== "Uma única vez" ? `, ${conta.frequencia.toLowerCase()}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <CampoValor padrao={conta.valor} rotulo={pagar ? "Valor pago" : "Valor recebido"} />
        <Campo rotulo={pagar ? "Pago em" : "Recebido em"}>
          {(id) => <input id={id} name="data" type="date" required defaultValue={hojeIso()} className="campo" />}
        </Campo>
      </div>
      <CampoSugestoes rotulo={pagar ? "Saiu da conta" : "Entrou na conta"} nome="conta" sugestoes={opcoes.contas} padrao={conta.conta} obrigatorio />

      <p className="text-sm text-tinta-suave">
        {ultima
          ? "É a última parcela: a conta sai da lista depois desta baixa."
          : "A conta continua na lista com o próximo vencimento."}{" "}
        O valor entra nos lançamentos de hoje.
      </p>

      <Erro estado={estado} />
      <BotaoEnviar>{pagar ? "Registrar pagamento" : "Registrar recebimento"}</BotaoEnviar>
    </form>
  );
}
