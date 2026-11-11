export const FREQUENCIAS = [
  "Uma única vez",
  "Semanal",
  "Quinzenal",
  "Mensal",
  "Bimestral",
  "Trimestral",
  "Semestral",
  "Anual",
] as const;

const MESES: Record<string, number> = { Mensal: 1, Bimestral: 2, Trimestral: 3, Semestral: 6, Anual: 12 };
const DIAS: Record<string, number> = { Semanal: 7, Quinzenal: 14 };

/** Próximo vencimento depois de uma baixa. Em meses, mantém o dia (31/01 -> 28/02). */
export function proximoVencimento(iso: string, frequencia: string): string | null {
  const [a, m, d] = iso.split("-").map(Number);
  if (DIAS[frequencia]) {
    const data = new Date(Date.UTC(a, m - 1, d + DIAS[frequencia]));
    return data.toISOString().slice(0, 10);
  }
  const meses = MESES[frequencia];
  if (!meses) return null;
  const alvo = new Date(Date.UTC(a, m - 1 + meses, 1));
  const ultimoDia = new Date(Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth() + 1, 0)).getUTCDate();
  alvo.setUTCDate(Math.min(d, ultimoDia));
  return alvo.toISOString().slice(0, 10);
}
