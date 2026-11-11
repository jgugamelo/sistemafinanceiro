// Converte os CSVs exportados do IOB Start em dados normalizados.
//   npm run importar -- --origem "../Sistema Financeiro"            -> grava data/*.json (uso local)
//   npm run importar -- --origem "../Sistema Financeiro" --supabase -> também envia para o Supabase (substitui o que estiver lá)
import fs from "node:fs";
import path from "node:path";

// carrega .env.local (se existir) para o envio ao Supabase
if (fs.existsSync(".env.local")) {
  for (const linha of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(linha.trim());
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(["'])(.*)\1$/, "$2");
  }
}

const args = process.argv.slice(2);
const arg = (nome, padrao) => {
  const i = args.indexOf(`--${nome}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : padrao;
};
const origem = path.resolve(arg("origem", "backup"));
const destino = path.resolve(arg("destino", "data"));
const enviarSupabase = args.includes("--supabase");

function lerCsv(arquivo) {
  const texto = fs.readFileSync(arquivo, "latin1");
  const linhas = [];
  let campo = "", linha = [], aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === ";") { linha.push(campo); campo = ""; }
    else if (c === "\n") { linha.push(campo); linhas.push(linha); linha = []; campo = ""; }
    else if (c !== "\r") campo += c;
  }
  if (campo || linha.length) { linha.push(campo); linhas.push(linha); }
  const [cab, ...resto] = linhas;
  return resto
    .filter((l) => l.length === cab.length)
    .map((l) => Object.fromEntries(cab.map((h, i) => [h.trim(), l[i].trim()])));
}

const numero = (s) => (s ? Number(s.replace(/\./g, "").replace(",", ".")) || 0 : 0);
const dataIso = (s) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s || "");
  return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
};
const limpar = (s) => (s || "").replace(/\s+/g, " ").trim();

if (!fs.existsSync(origem)) {
  console.error(`Pasta de origem não encontrada: ${origem}`);
  process.exit(1);
}
const arquivos = fs.readdirSync(origem);

// ---------- lançamentos ----------
const lancamentos = [];
for (const nome of arquivos.filter((a) => /^lancamentos_.*\.csv$/i.test(a)).sort()) {
  for (const r of lerCsv(path.join(origem, nome))) {
    if (r["Situação"] === "Cancelado") continue;
    const valor = numero(r["Valor"]);
    const transferencia = r["Tipo"] === "Transferência";
    lancamentos.push({
      id: `L${lancamentos.length + 1}`,
      conta: limpar(r["Conta"]),
      data: dataIso(r["Data"]),
      tipo: transferencia ? "transferencia" : valor >= 0 ? "receita" : "despesa",
      pessoa: limpar(r["Favorecido"]),
      plano: transferencia ? "" : limpar(r["Plano de Conta"]),
      centro: transferencia ? "" : limpar(r["Centro de Custo"]),
      historico: limpar(r["Histórico"]),
      valor,
      competencia: dataIso(r["Competência"]) || dataIso(r["Data"]),
    });
  }
}

// ---------- programações (a pagar / a receber) ----------
const programacoes = [];
for (const [nome, tipo] of [["contas_a_pagar.csv", "pagar"], ["contas_a_receber.csv", "receber"]]) {
  const arq = path.join(origem, nome);
  if (!fs.existsSync(arq)) continue;
  for (const r of lerCsv(arq)) {
    programacoes.push({
      id: `P${programacoes.length + 1}`,
      tipo,
      conta: limpar(r["Conta"]),
      parcela: limpar(r["Num-Parcela"]),
      pessoa: limpar(r["Cliente"]),
      plano: limpar(r["Plano de Conta"]),
      centro: limpar(r["Centro de Custo"]),
      historico: limpar(r["Histórico"]),
      vencimento: dataIso(r["Vencimento"]),
      frequencia: limpar(r["Frequência"]),
      valor: Math.abs(numero(r["VALOR_PROX_PARCELA"]) || numero(r["Valor"])),
      total: Math.abs(numero(r["Valor"])),
      // parcelas que faltam: só para contas com fim; recorrentes ficam sem (null)
      restantes: (() => {
        if (limpar(r["Frequência"]) === "Uma única vez") return 1;
        if (r["Fim Frequência"] !== "Sim") return null;
        const prox = Math.abs(numero(r["VALOR_PROX_PARCELA"]) || numero(r["Valor"]));
        return prox ? Math.max(1, Math.round(Math.abs(numero(r["Valor"])) / prox)) : 1;
      })(),
    });
  }
}

// ---------- pessoas ----------
const pessoas = [];
for (const [nome, tipo] of [["clientes.csv", "cliente"], ["fornecedores.csv", "fornecedor"]]) {
  const arq = path.join(origem, nome);
  if (!fs.existsSync(arq)) continue;
  for (const r of lerCsv(arq)) {
    if (!limpar(r["Nome"])) continue;
    pessoas.push({
      id: `C${pessoas.length + 1}`,
      tipo,
      nome: limpar(r["Nome"]),
      razao: limpar(r["Razão Social"]),
      pessoa: r["Tipo"] === "Pessoa Jurídica" ? "PJ" : "PF",
      documento: limpar(r["CNPJ"] || r["CPF"]),
      email: limpar(r["Email"]),
      telefone: limpar(r["Celular"] || r["Telefone"]),
      cidade: limpar(r["Cidade"]),
      uf: limpar(r["Estado"]),
      inativo: /^(sim|1|true)$/i.test(r["Inativo"] || "") ? "sim" : "",
    });
  }
}

fs.mkdirSync(destino, { recursive: true });
const tabelas = { lancamentos, programacoes, pessoas };
for (const [nome, linhas] of Object.entries(tabelas)) {
  fs.writeFileSync(path.join(destino, `${nome}.json`), JSON.stringify(linhas));
  console.log(`${nome}: ${linhas.length} linhas`);
}

// ---------- envio para o Supabase ----------
if (enviarSupabase) {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) {
    console.error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local (veja o README).");
    process.exit(1);
  }
  const banco = createClient(url, chave, { auth: { persistSession: false } });
  const nulo = (v) => (v === "" ? null : v);
  const preparar = {
    lancamentos: ({ id, ...l }) => ({ ...l, competencia: nulo(l.competencia) }),
    programacoes: ({ id, ...p }) => ({ ...p, vencimento: nulo(p.vencimento) }),
    pessoas: ({ id, ...p }) => ({ ...p, inativo: p.inativo === "sim" }),
  };
  for (const [nome, linhas] of Object.entries(tabelas)) {
    const tabela = `fin_${nome}`;
    // substitui o conteúdo: apaga tudo e insere de novo, em lotes de 1000
    const apagar = await banco.from(tabela).delete().gte("id", 0);
    if (apagar.error) { console.error(`${tabela}: ${apagar.error.message}`); process.exit(1); }
    const prontas = linhas.map(preparar[nome]);
    for (let i = 0; i < prontas.length; i += 1000) {
      const { error } = await banco.from(tabela).insert(prontas.slice(i, i + 1000));
      if (error) { console.error(`${tabela}: ${error.message}`); process.exit(1); }
    }
    const { count } = await banco.from(tabela).select("*", { count: "exact", head: true });
    console.log(`supabase: ${tabela} com ${count} linhas`);
  }
}
