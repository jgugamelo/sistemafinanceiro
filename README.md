# Financeiro

App de gestão financeira da empresa. Substitui o IOB Start.

**Nesta versão:** painel de KPIs e quatro relatórios (por cliente e fornecedor, por centro de custo, por plano de contas e contas por vencimento), somente leitura. Lançamentos, contas a pagar e receber, cadastros, orçamento e boletos vêm nas próximas.

Feito com Next.js 14, TypeScript e Tailwind. Os dados ficam numa planilha Google; o acesso está isolado em `src/lib/dados`, então trocar por Postgres depois é escrever um novo arquivo ali, sem mexer nas telas.

## 1. Rodar no seu computador

Precisa do Node.js 20 ou mais novo.

```bash
npm install
cp .env.example .env.local
npm run importar -- --origem "../"      # pasta onde estão os CSVs exportados do IOB
npm run dev
```

Abra http://localhost:3000. Com `DADOS=local` e `LOGIN_DESATIVADO=1` (o padrão do `.env.example`) o app lê `data/*.json` e não pede login.

Os CSVs e a pasta `data/` estão no `.gitignore`: dados financeiros não vão para o GitHub.

## 2. Planilha Google como banco

1. Crie uma planilha vazia no Google Sheets. O ID é o trecho da URL entre `/d/` e `/edit`.
2. No Google Cloud Console, crie um projeto, ative a **Google Sheets API** e crie uma **conta de serviço** com uma chave JSON.
3. Compartilhe a planilha com o e-mail da conta de serviço, como **Editor**.
4. Preencha no `.env.local`:
   - `GOOGLE_SHEETS_ID`: o ID da planilha
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`: o `client_email` do JSON
   - `GOOGLE_PRIVATE_KEY`: o `private_key` do JSON, entre aspas, numa linha só (com os `\n`)
5. Envie os dados e passe a ler da planilha:

```bash
npm run importar -- --origem "../" --sheets
# depois troque DADOS=local por DADOS=sheets no .env.local
```

O envio cria as abas `lancamentos`, `programacoes` e `pessoas` e **substitui** o conteúdo delas. A primeira linha de cada aba são os nomes das colunas; não renomeie.

O app guarda cada aba em memória por 5 minutos, então uma edição feita direto na planilha pode levar esse tempo para aparecer.

## 3. Login com Google

1. No mesmo projeto do Google Cloud, configure a tela de consentimento OAuth e crie um **ID do cliente OAuth** do tipo "Aplicativo da Web".
2. Em "URIs de redirecionamento autorizados", inclua:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://SEU-DOMINIO/api/auth/callback/google`
3. Preencha `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_URL` e `NEXTAUTH_SECRET` (gere com `openssl rand -base64 32`).
4. Em `EMAILS_AUTORIZADOS`, liste os e-mails que podem entrar, separados por vírgula. Lista vazia bloqueia todo mundo.

`LOGIN_DESATIVADO=1` só funciona em `npm run dev`. Em produção o login é sempre exigido.

## 4. GitHub e Vercel

```bash
git init -b main
git add -A
git commit -m "Painel e relatórios"
git remote add origin https://github.com/jgugamelo/sistemafinanceiro.git
git push -u origin main
```

Na Vercel, importe o repositório e cadastre as variáveis de ambiente das seções 2 e 3, com `DADOS=sheets` e `NEXTAUTH_URL` apontando para o endereço da Vercel. Não cadastre `LOGIN_DESATIVADO`.

Em servidor próprio: `npm run build && npm run start`, com as mesmas variáveis, atrás de HTTPS.

## Estrutura

| Pasta | O que tem |
| --- | --- |
| `scripts/importar.mjs` | Converte os CSVs do IOB e envia para a planilha |
| `src/lib/dados` | Fonte de dados: `local.ts` (JSON) e `sheets.ts` (Google Sheets) |
| `src/lib/calculos.ts` | Regras dos KPIs e relatórios |
| `src/app/(app)` | Painel e relatórios |
| `src/app/login` | Tela de login |

## Regras de cálculo

- Transferências entre contas próprias não contam como receita nem despesa.
- Lançamentos cancelados não são importados.
- "A pagar" e "a receber" usam a próxima parcela de cada conta programada, que é o que o IOB exporta.
