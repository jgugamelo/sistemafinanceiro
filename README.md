# Financeiro

App de gestão financeira da empresa. Substitui o IOB Start.

**Nesta versão:** painel de KPIs e quatro relatórios (por cliente e fornecedor, por centro de custo, por plano de contas e contas por vencimento), somente leitura. Lançamentos, contas a pagar e receber, cadastros, orçamento e boletos vêm nas próximas.

Feito com Next.js 14, TypeScript e Tailwind. Os dados ficam no Supabase (Postgres); o acesso está isolado em `src/lib/dados`.

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

## 2. Supabase como banco

As tabelas `fin_lancamentos`, `fin_programacoes` e `fin_pessoas` já existem no projeto `qapkfezynuldhjlklhzz`, com RLS ligado e sem políticas: só a chave de serviço lê e grava.

1. No painel do Supabase, em Project Settings > API, copie a chave **service_role**. Ela é secreta.
2. No `.env.local`, preencha `SUPABASE_SERVICE_ROLE_KEY` (a `SUPABASE_URL` já vem preenchida).
3. Envie o backup e passe a ler do banco:

```bash
npm run importar -- --origem "../" --supabase
# depois troque DADOS=local por DADOS=supabase no .env.local
```

O envio **apaga e recria** o conteúdo das três tabelas. Use só para a carga inicial ou para recomeçar do backup.

O app guarda cada tabela em memória por 5 minutos, então uma alteração feita direto no banco pode levar esse tempo para aparecer.

## 3. Quem pode abrir o app

O app escolhe o modo de acesso pelas variáveis de ambiente, nesta ordem:

| Variável | Efeito |
| --- | --- |
| `SENHA_ACESSO=algumasenha` | O navegador pede usuário e senha. O usuário pode ser qualquer um; a senha é a da variável. Recomendado para a fase de testes. |
| `LOGIN_DESATIVADO=1` | Abre sem pedir nada. Qualquer pessoa com o endereço vê os dados financeiros. |
| nenhuma das duas | Login com Google, restrito a `EMAILS_AUTORIZADOS`. |

Para o login com Google: no Google Cloud, crie um ID do cliente OAuth do tipo "Aplicativo da Web", inclua `https://SEU-DOMINIO/api/auth/callback/google` nos URIs de redirecionamento e preencha `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET` (gere com `openssl rand -base64 32`) e `EMAILS_AUTORIZADOS`.

## 4. GitHub e Vercel

```bash
git add -A
git commit -m "Supabase como banco e senha de acesso para testes"
git push
```

Na Vercel, em Settings > Environment Variables, cadastre `DADOS=supabase`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e `SENHA_ACESSO`, e faça um novo deploy. Variáveis novas só valem a partir do deploy seguinte.

Em servidor próprio: `npm run build && npm run start`, com as mesmas variáveis, atrás de HTTPS.

## Estrutura

| Pasta | O que tem |
| --- | --- |
| `scripts/importar.mjs` | Converte os CSVs do IOB e envia para o Supabase |
| `src/lib/dados` | Fonte de dados: `local.ts` (JSON, para testes) e `supabase.ts` |
| `src/lib/calculos.ts` | Regras dos KPIs e relatórios |
| `src/app/(app)` | Painel e relatórios |
| `src/app/login` | Tela de login |

## Regras de cálculo

- Transferências entre contas próprias não contam como receita nem despesa.
- Lançamentos cancelados não são importados.
- "A pagar" e "a receber" usam a próxima parcela de cada conta programada, que é o que o IOB exporta.
