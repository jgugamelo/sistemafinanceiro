"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import { Contador } from "@/components/ui/Contador";
import { Icone } from "@/components/ui/Icone";
import { useMovimentoReduzido } from "@/components/ui/useMovimentoReduzido";
import type { HistoricoSaldos } from "@/lib/calculos";
import { brl, dataBr } from "@/lib/formato";

const CHAVE = "financeiro:cartao-saldo";

/** Linhas onduladas de segurança, como as de uma cédula. Calculadas uma vez, iguais no servidor e no navegador. */
const GUILHOCHE = Array.from({ length: 16 }, (_, k) => {
  const pontos: string[] = [];
  for (let x = 0; x <= 1200; x += 12) {
    const y = 40 + k * 22 + Math.sin(x / 70 + k * 0.55) * 16 + Math.sin(x / 23 + k) * 3;
    pontos.push(`${x},${y.toFixed(1)}`);
  }
  return `M${pontos.join("L")}`;
});

interface Preferencias {
  excluidas: string[];
  porConta: boolean;
  oculto: boolean;
}

export function CartaoSaldo({ historico }: { historico: HistoricoSaldos }) {
  const [pref, setPref] = useState<Preferencias>({ excluidas: [], porConta: false, oculto: false });
  const [ajustando, setAjustando] = useState(false);
  const caixaAjustes = useRef<HTMLDivElement>(null);
  const reduzido = useMovimentoReduzido();

  // Preferências guardadas neste navegador
  useEffect(() => {
    try {
      const salvo = localStorage.getItem(CHAVE);
      if (salvo) setPref((p) => ({ ...p, ...JSON.parse(salvo) }));
    } catch {}
  }, []);
  const mudar = (parcial: Partial<Preferencias>) =>
    setPref((p) => {
      const nova = { ...p, ...parcial };
      try {
        localStorage.setItem(CHAVE, JSON.stringify(nova));
      } catch {}
      return nova;
    });

  useEffect(() => {
    if (!ajustando) return;
    const fora = (e: MouseEvent) => !caixaAjustes.current?.contains(e.target as Node) && setAjustando(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAjustando(false);
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [ajustando]);

  const visiveis = historico.contas.filter((c) => !pref.excluidas.includes(c.conta));
  const total = visiveis.reduce((s, c) => s + c.saldo, 0);

  const serie = useMemo(() => {
    let acumulado = visiveis.reduce((s, c) => s + c.inicial, 0);
    return historico.datas.map((data, i) => {
      for (const c of visiveis) acumulado += c.deltas[i];
      return { data, saldo: Math.round(acumulado * 100) / 100 };
    });
  }, [historico, pref.excluidas]); // eslint-disable-line react-hooks/exhaustive-deps
  const variacao = serie.length ? serie[serie.length - 1].saldo - serie[0].saldo : 0;

  const alternarConta = (conta: string) =>
    mudar({ excluidas: pref.excluidas.includes(conta) ? pref.excluidas.filter((c) => c !== conta) : [...pref.excluidas, conta] });

  const resumo =
    visiveis.length === historico.contas.length
      ? `Soma das ${historico.contas.length} contas`
      : visiveis.length === 0
        ? "Nenhuma conta selecionada"
        : `Soma de ${visiveis.length} de ${historico.contas.length} contas`;

  return (
    <section aria-label="Saldo em contas" className="relative isolate overflow-hidden rounded-cedula bg-cedula text-white shadow-flutuante">
      {/* fundo: degradê e linhas de cédula */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_100%_0%,#2B6E57_0%,transparent_55%),radial-gradient(90%_80%_at_0%_100%,#0A2A20_0%,transparent_60%)]" aria-hidden />
      <svg className="absolute inset-0 -z-10 h-full w-full opacity-[.13]" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid slice" aria-hidden>
        {GUILHOCHE.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#E9D7A6" strokeWidth="0.8" />
        ))}
      </svg>

      <div className="p-5 sm:p-7 xl:p-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-medium text-white/75" style={{ fontFamily: "inherit", letterSpacing: 0 }}>
              Saldo em contas
            </h2>
            <p className="mt-1 font-titulo text-[40px] font-semibold leading-none tracking-tight sm:text-[56px] xl:text-[64px]" style={{ fontVariationSettings: '"wdth" 88' }}>
              <Contador valor={total} oculto={pref.oculto} duracao={1100} />
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => mudar({ oculto: !pref.oculto })}
              aria-pressed={pref.oculto}
              aria-label={pref.oculto ? "Mostrar valores" : "Esconder valores"}
              className="grid h-10 w-10 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Icone nome={pref.oculto ? "olhoFechado" : "olho"} />
            </button>
            <div className="relative" ref={caixaAjustes}>
              <button
                type="button"
                onClick={() => setAjustando((a) => !a)}
                aria-expanded={ajustando}
                aria-label="Escolher contas"
                className={`grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-white/10 ${ajustando ? "bg-white/15 text-white" : "text-white/80"}`}
              >
                <Icone nome="ajustes" />
              </button>
              {ajustando && (
                <div className="absolute right-0 top-12 z-20 w-72 animate-surgir rounded-2xl bg-white p-2 text-tinta shadow-flutuante">
                  <div className="flex items-center justify-between px-2.5 pb-1 pt-1.5">
                    <p className="text-sm font-semibold">Contas no saldo</p>
                    <div className="flex gap-3 text-xs font-semibold text-cedula-medio">
                      <button type="button" onClick={() => mudar({ excluidas: [] })} className="hover:underline">
                        Todas
                      </button>
                      <button type="button" onClick={() => mudar({ excluidas: historico.contas.map((c) => c.conta) })} className="hover:underline">
                        Nenhuma
                      </button>
                    </div>
                  </div>
                  <ul className="max-h-80 overflow-y-auto">
                    {historico.contas.map((c) => {
                      const marcada = !pref.excluidas.includes(c.conta);
                      return (
                        <li key={c.conta}>
                          <label className="flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm hover:bg-fundo">
                            <input type="checkbox" checked={marcada} onChange={() => alternarConta(c.conta)} className="h-4 w-4 accent-cedula" />
                            <span className="min-w-0 flex-1 truncate">{c.conta}</span>
                            <span className={`valor text-xs ${c.saldo < 0 ? "text-saida" : "text-tinta-fraca"}`}>{pref.oculto ? "••••" : brl(c.saldo)}</span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <span className="text-white/70">{resumo}</span>
          {!pref.oculto && visiveis.length > 0 && (
            <span className="valor rounded-full bg-white/10 px-2.5 py-1 text-[13px] font-semibold text-latao-claro">
              {variacao >= 0 ? "+" : "−"}
              {brl(Math.abs(variacao))} em 90 dias
            </span>
          )}
        </div>

        <div className="-mx-1 mt-4 h-24 sm:h-28" aria-hidden={pref.oculto}>
          {!pref.oculto && visiveis.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={serie} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                <defs>
                  <linearGradient id="preenchimento-saldo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E9D7A6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#E9D7A6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <YAxis hide domain={["dataMin", "dataMax"]} />
                <Tooltip
                  cursor={{ stroke: "rgba(255,255,255,.35)" }}
                  formatter={(v: number) => [brl(v), "Saldo"]}
                  labelFormatter={(_, p) => (p?.[0] ? dataBr(String((p[0].payload as { data: string }).data)) : "")}
                  contentStyle={{ borderRadius: 12, border: "none", fontSize: 13, color: "#10201A", boxShadow: "0 8px 24px rgba(0,0,0,.18)" }}
                />
                <Area type="monotone" dataKey="saldo" stroke="#E9D7A6" strokeWidth={2} fill="url(#preenchimento-saldo)" isAnimationActive={!reduzido} animationDuration={1400} animationEasing="ease-out" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/15 pt-4">
          <span className="text-sm font-medium text-white/80" id="rotulo-por-conta">
            Ver saldo de cada conta
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={pref.porConta}
            aria-labelledby="rotulo-por-conta"
            onClick={() => mudar({ porConta: !pref.porConta })}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${pref.porConta ? "bg-latao" : "bg-white/20"}`}
          >
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-[left] ${pref.porConta ? "left-6" : "left-1"}`} />
          </button>
        </div>

        <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${pref.porConta ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
          <div className="overflow-hidden">
            <ul className="grid grid-cols-2 gap-2 pt-4 sm:grid-cols-3 2xl:grid-cols-5">
              {visiveis.map((c) => (
                <li key={c.conta} className="rounded-2xl bg-white/[.07] px-3.5 py-3 ring-1 ring-inset ring-white/10">
                  <p className="truncate text-[13px] text-white/70">{c.conta}</p>
                  <p className={`valor mt-0.5 text-[17px] font-semibold ${c.saldo < 0 ? "text-[#FFB4A8]" : ""}`}>{pref.oculto ? "R$ ••••" : brl(c.saldo)}</p>
                </li>
              ))}
              {visiveis.length === 0 && <li className="col-span-full text-sm text-white/70">Marque as contas no botão de ajustes, ao lado do saldo.</li>}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
