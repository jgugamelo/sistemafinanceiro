"use client";

import { useState } from "react";
import { excluirPessoa, salvarPessoa } from "@/app/acoes";
import { BotaoEnviar, Campo, Erro, Segmentado, useEnvio } from "@/components/ui/Formulario";
import type { Pessoa } from "@/lib/types";

export function FormPessoa({ inicial, aoConcluir }: { inicial?: Pessoa; aoConcluir: () => void }) {
  const [tipo, setTipo] = useState<Pessoa["tipo"]>(inicial?.tipo ?? "fornecedor");
  const [natureza, setNatureza] = useState<Pessoa["pessoa"]>(inicial?.pessoa ?? "PJ");
  const { estado, enviar } = useEnvio(salvarPessoa, aoConcluir);
  const exclusao = useEnvio(excluirPessoa, aoConcluir);
  const [confirmar, setConfirmar] = useState(false);

  return (
    <>
      <form action={enviar} className="flex flex-col gap-4">
        {inicial && <input type="hidden" name="id" value={inicial.id} />}
        <div className="grid gap-3 sm:grid-cols-2">
          <Segmentado
            rotulo="Cliente ou fornecedor"
            nome="tipo"
            valor={tipo}
            aoMudar={setTipo}
            opcoes={[
              { valor: "fornecedor", rotulo: "Fornecedor" },
              { valor: "cliente", rotulo: "Cliente" },
            ]}
          />
          <Segmentado
            rotulo="Pessoa física ou jurídica"
            nome="pessoa"
            valor={natureza}
            aoMudar={setNatureza}
            opcoes={[
              { valor: "PJ", rotulo: "Empresa" },
              { valor: "PF", rotulo: "Pessoa física" },
            ]}
          />
        </div>

        <Campo rotulo="Nome">
          {(id) => <input id={id} name="nome" required defaultValue={inicial?.nome} autoComplete="off" className="campo" />}
        </Campo>
        {natureza === "PJ" && (
          <Campo rotulo="Razão social">
            {(id) => <input id={id} name="razao" defaultValue={inicial?.razao} autoComplete="off" className="campo" />}
          </Campo>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo={natureza === "PJ" ? "CNPJ" : "CPF"}>
            {(id) => <input id={id} name="documento" inputMode="numeric" defaultValue={inicial?.documento} autoComplete="off" className="campo" />}
          </Campo>
          <Campo rotulo="Telefone">
            {(id) => <input id={id} name="telefone" type="tel" defaultValue={inicial?.telefone} className="campo" />}
          </Campo>
        </div>
        <Campo rotulo="E-mail">
          {(id) => <input id={id} name="email" type="email" defaultValue={inicial?.email} className="campo" />}
        </Campo>
        <div className="grid grid-cols-[1fr_5rem] gap-3">
          <Campo rotulo="Cidade">{(id) => <input id={id} name="cidade" defaultValue={inicial?.cidade} className="campo" />}</Campo>
          <Campo rotulo="UF">{(id) => <input id={id} name="uf" maxLength={2} defaultValue={inicial?.uf} className="campo uppercase" />}</Campo>
        </div>
        {inicial && (
          <label className="flex items-center gap-3 rounded-xl bg-fundo px-3.5 py-3 text-sm">
            <input type="checkbox" name="inativo" defaultChecked={Boolean(inicial.inativo)} className="h-4 w-4 accent-cedula" />
            Inativo: não aparece mais nas sugestões dos formulários
          </label>
        )}

        <Erro estado={estado} />
        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
          {inicial ? (
            <button type="button" className="botao-perigo" onClick={() => setConfirmar(true)}>
              Excluir cadastro
            </button>
          ) : (
            <span />
          )}
          <BotaoEnviar>{inicial ? "Salvar alterações" : tipo === "cliente" ? "Cadastrar cliente" : "Cadastrar fornecedor"}</BotaoEnviar>
        </div>
      </form>

      {confirmar && inicial && (
        <form action={exclusao.enviar} className="mt-4 rounded-2xl border border-saida/30 bg-saida-claro p-4 text-sm">
          <input type="hidden" name="id" value={inicial.id} />
          <p className="font-semibold text-saida">Excluir {inicial.nome}?</p>
          <p className="mt-1 text-tinta-suave">Os lançamentos com esse nome continuam como estão. Para só esconder das sugestões, marque como inativo.</p>
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
