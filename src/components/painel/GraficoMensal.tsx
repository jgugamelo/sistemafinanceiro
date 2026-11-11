"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useMovimentoReduzido } from "@/components/ui/useMovimentoReduzido";
import { brl, brlCurto, mesCurto } from "@/lib/formato";

interface Ponto {
  mes: string;
  receitas: number;
  despesas: number;
}

export function GraficoMensal({ dados }: { dados: Ponto[] }) {
  const reduzido = useMovimentoReduzido();
  return (
    <div className="h-64 w-full sm:h-80" role="img" aria-label="Receitas e despesas por mês nos últimos 12 meses">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} margin={{ top: 8, right: 0, left: 0, bottom: 0 }} barGap={3} barCategoryGap="24%">
          <CartesianGrid vertical={false} stroke="#E4EAE5" />
          <XAxis dataKey="mes" tickFormatter={mesCurto} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#7D8C85" }} interval="preserveStartEnd" minTickGap={10} />
          <YAxis
            tickFormatter={(v: number) => brlCurto(v).replace("R$", "").trim()}
            tickLine={false}
            axisLine={false}
            width={56}
            tick={{ fontSize: 12, fill: "#7D8C85" }}
          />
          <Tooltip
            cursor={{ fill: "rgba(15,61,47,.06)", radius: 8 }}
            formatter={(valor: number, nome: string) => [brl(valor), nome === "receitas" ? "Receitas" : "Despesas"]}
            labelFormatter={(rotulo: string) => mesCurto(rotulo)}
            contentStyle={{ borderRadius: 14, border: "1px solid #DCE3DD", fontSize: 13, boxShadow: "0 8px 24px rgba(16,32,26,.1)" }}
          />
          <Bar dataKey="receitas" fill="#1F7A52" radius={[6, 6, 2, 2]} isAnimationActive={!reduzido} animationDuration={900} />
          <Bar dataKey="despesas" fill="#B42318" radius={[6, 6, 2, 2]} isAnimationActive={!reduzido} animationDuration={900} animationBegin={150} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
