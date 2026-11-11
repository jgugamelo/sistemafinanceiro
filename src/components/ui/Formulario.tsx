"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import type { Resultado } from "@/app/acoes";
import { avisar } from "./Avisos";

type Acao = (estado: Resultado, dados: FormData) => Promise<Resultado>;

/** Liga um formulário a uma ação do servidor: mostra o erro, avisa quando salvou e atualiza a tela. */
export function useEnvio(acao: Acao, aoConcluir?: () => void) {
  const [estado, enviar] = useFormState(acao, { ok: false } as Resultado);
  const router = useRouter();
  const ultima = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!estado.vez || estado.vez === ultima.current) return;
    ultima.current = estado.vez;
    if (estado.ok) {
      if (estado.mensagem) avisar(estado.mensagem);
      aoConcluir?.();
      router.refresh();
    }
  }, [estado, aoConcluir, router]);

  return { estado, enviar };
}

export function Erro({ estado }: { estado: Resultado }) {
  if (estado.ok || !estado.erro) return null;
  return (
    <p role="alert" className="rounded-xl bg-saida-claro px-3.5 py-2.5 text-sm font-medium text-saida">
      {estado.erro}
    </p>
  );
}

export function BotaoEnviar({ children, className = "botao-principal", ...resto }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className} {...resto}>
      {pending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden />}
      {children}
    </button>
  );
}

export function Campo({
  rotulo,
  dica,
  className = "",
  children,
}: {
  rotulo: string;
  dica?: string;
  className?: string;
  children: (id: string) => React.ReactNode;
}) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-semibold text-tinta-suave">
        {rotulo}
      </label>
      {children(id)}
      {dica && <p className="mt-1 text-xs text-tinta-fraca">{dica}</p>}
    </div>
  );
}

/** Campo de texto com sugestões; aceita também um valor novo. */
export function CampoSugestoes({
  rotulo,
  nome,
  sugestoes,
  padrao,
  obrigatorio,
  className,
  placeholder,
}: {
  rotulo: string;
  nome: string;
  sugestoes: string[];
  padrao?: string;
  obrigatorio?: boolean;
  className?: string;
  placeholder?: string;
}) {
  const idLista = useId();
  return (
    <Campo rotulo={rotulo} className={className}>
      {(id) => (
        <>
          <input id={id} name={nome} list={idLista} defaultValue={padrao} required={obrigatorio} placeholder={placeholder} autoComplete="off" className="campo" />
          <datalist id={idLista}>
            {sugestoes.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </>
      )}
    </Campo>
  );
}

export function CampoValor({ padrao, rotulo = "Valor" }: { padrao?: number; rotulo?: string }) {
  return (
    <Campo rotulo={rotulo}>
      {(id) => (
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-tinta-fraca">R$</span>
          <input
            id={id}
            name="valor"
            inputMode="decimal"
            required
            autoComplete="off"
            placeholder="0,00"
            defaultValue={padrao ? padrao.toFixed(2).replace(".", ",") : ""}
            className="campo valor pl-10 text-lg font-semibold"
          />
        </div>
      )}
    </Campo>
  );
}

/** Botões de escolha única, como "Despesa / Receita / Transferência". */
export function Segmentado<T extends string>({
  nome,
  opcoes,
  valor,
  aoMudar,
  rotulo,
}: {
  nome: string;
  opcoes: { valor: T; rotulo: string; tom?: string }[];
  valor: T;
  aoMudar: (v: T) => void;
  rotulo: string;
}) {
  return (
    <fieldset>
      <legend className="sr-only">{rotulo}</legend>
      <div className="grid gap-1 rounded-2xl bg-fundo p-1" style={{ gridTemplateColumns: `repeat(${opcoes.length}, minmax(0, 1fr))` }}>
        {opcoes.map((o) => {
          const ativo = o.valor === valor;
          return (
            <label
              key={o.valor}
              className={`relative flex min-h-[42px] cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-cedula-medio items-center justify-center rounded-xl px-2 text-sm font-semibold transition-all ${
                ativo ? `bg-white shadow-superficie ${o.tom ?? "text-tinta"}` : "text-tinta-suave hover:text-tinta"
              }`}
            >
              <input type="radio" name={nome} value={o.valor} checked={ativo} onChange={() => aoMudar(o.valor)} className="sr-only" />
              {o.rotulo}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
