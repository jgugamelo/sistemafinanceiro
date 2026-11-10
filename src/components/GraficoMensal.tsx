"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { brl, brlCurto, mesCurto } from "@/lib/formato";

interface Ponto {
  mes: string;
  receitas: number;
  despesas: number;
}

export function GraficoMensal({ dados }: { dados: Ponto[] }) {
  return (
    <div className="h-56 w-full sm:h-72" role="img" aria-label="Receitas e despesas por mês nos últimos 12 meses">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barGap={2} barCategoryGap="22%">
          <CartesianGrid vertical={false} stroke="#e4e0d6" />
          <XAxis
            dataKey="mes"
            tickFormatter={mesCurto}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#16202e99" }}
            interval="preserveStartEnd"
            minTickGap={12}
          />
          <YAxis
            tickFormatter={(v: number) => brlCurto(v).replace("R$", "").trim()}
            tickLine={false}
            axisLine={false}
            width={54}
            tick={{ fontSize: 11, fill: "#16202e99" }}
          />
          <Tooltip
            cursor={{ fill: "#16202e0d" }}
            formatter={(valor: number, nome: string) => [brl(valor), nome === "receitas" ? "Receitas" : "Despesas"]}
            labelFormatter={(rotulo: string) => mesCurto(rotulo)}
            contentStyle={{ borderRadius: 12, border: "1px solid #e4e0d6", fontSize: 13 }}
          />
          <Bar isAnimationActive={false} dataKey="receitas" fill="#0f7a5c" radius={[4, 4, 0, 0]} />
          <Bar isAnimationActive={false} dataKey="despesas" fill="#c2412d" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
