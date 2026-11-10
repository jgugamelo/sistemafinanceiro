import { google } from "googleapis";
import type { Lancamento, Pessoa, Programacao, Repositorio } from "../types";

function cliente() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const chave = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  if (!email || !chave || !process.env.GOOGLE_SHEETS_ID) {
    throw new Error("Google Sheets não configurado: defina GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL e GOOGLE_PRIVATE_KEY.");
  }
  const auth = new google.auth.JWT({
    email,
    key: chave,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

const NUMERICOS = new Set(["valor", "total"]);

/** Lê uma aba inteira; a primeira linha são os nomes das colunas. */
async function lerAba<T>(aba: string): Promise<T[]> {
  const resposta = await cliente().spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    range: aba,
    valueRenderOption: "UNFORMATTED_VALUE",
  });
  const [cabecalho, ...linhas] = (resposta.data.values || []) as unknown[][];
  if (!cabecalho) return [];
  const colunas = cabecalho.map(String);
  return linhas.map((linha) => {
    const item: Record<string, unknown> = {};
    colunas.forEach((coluna, i) => {
      const bruto = linha[i] ?? "";
      item[coluna] = NUMERICOS.has(coluna) ? Number(bruto) || 0 : String(bruto);
    });
    return item as T;
  });
}

export const repositorioSheets: Repositorio = {
  lancamentos: () => lerAba<Lancamento>("lancamentos"),
  programacoes: () => lerAba<Programacao>("programacoes"),
  pessoas: () => lerAba<Pessoa>("pessoas"),
};
