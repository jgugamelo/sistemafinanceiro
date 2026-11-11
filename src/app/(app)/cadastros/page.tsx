import Link from "next/link";
import { EditarPessoa, NovaPessoa } from "@/components/Abridores";
import { AdicionarItem, AlternarItem } from "@/components/formularios/FormItemLista";
import { Icone } from "@/components/ui/Icone";
import { Cabecalho, Chips, Vazio } from "@/components/ui/Partes";
import { dados } from "@/lib/dados";
import { dataBr } from "@/lib/formato";
import { itensCadastro, type ItemCadastro } from "@/lib/opcoes";
import type { TipoLista } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cadastros" };

const ABAS = [
  { id: "pessoas", rotulo: "Clientes e fornecedores" },
  { id: "conta", rotulo: "Contas" },
  { id: "plano", rotulo: "Planos de contas" },
  { id: "centro", rotulo: "Centros de custo" },
] as const;

const FILTROS = [
  { id: "todos", rotulo: "Todos" },
  { id: "fornecedor", rotulo: "Fornecedores" },
  { id: "cliente", rotulo: "Clientes" },
  { id: "inativos", rotulo: "Inativos" },
] as const;

const sem = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

type Busca = { aba?: string; filtro?: string; busca?: string };

export default async function CadastrosPage({ searchParams }: { searchParams: Busca }) {
  const aba = ABAS.find((a) => a.id === searchParams.aba)?.id ?? "pessoas";

  return (
    <>
      <Cabecalho titulo="Cadastros" descricao="Quem paga, quem recebe e como o dinheiro é classificado.">
        {aba === "pessoas" && <NovaPessoa />}
      </Cabecalho>
      <div className="mb-5">
        <Chips rotulo="Tipo de cadastro" opcoes={ABAS} atual={aba} href={(id) => `/cadastros?aba=${id}`} />
      </div>
      {aba === "pessoas" ? <Pessoas filtro={searchParams.filtro} busca={searchParams.busca} /> : <Listas tipo={aba} />}
    </>
  );
}

async function Pessoas({ filtro: filtroBruto, busca: buscaBruta }: { filtro?: string; busca?: string }) {
  const pessoas = await dados.pessoas();
  const filtro = FILTROS.find((f) => f.id === filtroBruto)?.id ?? "todos";
  const busca = (buscaBruta ?? "").trim();
  const termo = sem(busca);
  const lista = pessoas
    .filter((p) => (filtro === "inativos" ? p.inativo : !p.inativo) && (filtro === "todos" || filtro === "inativos" || p.tipo === filtro))
    .filter((p) => !termo || sem(`${p.nome} ${p.razao} ${p.documento} ${p.email} ${p.cidade}`).includes(termo))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));
  const link = (f: string) => `/cadastros?aba=pessoas&filtro=${f}${busca ? `&busca=${encodeURIComponent(busca)}` : ""}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <form action="/cadastros" className="relative lg:w-[420px]">
          <input type="hidden" name="aba" value="pessoas" />
          <input type="hidden" name="filtro" value={filtro} />
          <Icone nome="busca" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-tinta-fraca" />
          <input type="search" name="busca" defaultValue={busca} placeholder="Buscar por nome, documento ou cidade" aria-label="Buscar cadastros" className="campo h-12 rounded-2xl pl-12" />
        </form>
        <Chips rotulo="Filtro" opcoes={FILTROS} atual={filtro} href={link} />
      </div>

      <section className="superficie p-2" aria-label="Cadastros">
        <p className="px-3 pb-2 pt-2 text-sm font-semibold text-tinta-suave">{lista.length === 1 ? "1 cadastro" : `${lista.length} cadastros`}</p>
        {lista.length === 0 ? (
          <Vazio titulo="Nenhum cadastro encontrado">
            {busca ? (
              <Link href={link(filtro).replace(/&busca=.*/, "")} className="font-semibold text-cedula-medio underline">
                Limpar a busca
              </Link>
            ) : (
              "Use o botão Novo cadastro para adicionar."
            )}
          </Vazio>
        ) : (
          <ul className="grid gap-x-2 md:grid-cols-2 2xl:grid-cols-3">
            {lista.map((p) => (
              <li key={p.id}>
                <EditarPessoa pessoa={p}>
                  <span className="flex items-center gap-3 px-3 py-2.5">
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full font-titulo text-[15px] font-semibold ${
                        p.tipo === "cliente" ? "bg-entrada-claro text-entrada" : "bg-cedula-claro text-cedula"
                      }`}
                      aria-hidden
                    >
                      {p.nome.replace(/[^\p{L}\p{N}]/gu, "").slice(0, 2).toUpperCase() || "?"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold">{p.nome}</span>
                      <span className="block truncate text-[13px] text-tinta-fraca">
                        {[p.tipo === "cliente" ? "Cliente" : "Fornecedor", p.cidade && `${p.cidade}${p.uf ? `/${p.uf}` : ""}`, p.documento].filter(Boolean).join(", ")}
                      </span>
                    </span>
                  </span>
                </EditarPessoa>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const TEXTOS: Record<TipoLista, { explicacao: string; vazio: string }> = {
  conta: {
    explicacao: "Bancos, cartões e caixas. Contas desativadas somem das sugestões, mas o histórico continua.",
    vazio: "Nenhuma conta ainda",
  },
  plano: {
    explicacao: "Como receitas e despesas são classificadas nos relatórios. Agrupados pelo nome antes dos dois-pontos.",
    vazio: "Nenhum plano de contas ainda",
  },
  centro: {
    explicacao: "Áreas ou unidades que geram cada despesa. Agrupados pelo nome antes dos dois-pontos.",
    vazio: "Nenhum centro de custo ainda",
  },
};

async function Listas({ tipo }: { tipo: TipoLista }) {
  const itens = (await itensCadastro()).filter((i) => i.tipo === tipo && i.nome !== "(Parcelado)");
  const grupos = new Map<string, ItemCadastro[]>();
  for (const i of itens) {
    const grupo = tipo === "conta" ? "" : i.nome.includes(":") ? i.nome.split(":")[0] : i.nome;
    grupos.set(grupo, [...(grupos.get(grupo) ?? []), i]);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section className="superficie order-2 overflow-hidden xl:order-1" aria-label="Itens cadastrados">
        {itens.length === 0 ? (
          <Vazio titulo={TEXTOS[tipo].vazio}>Adicione o primeiro no campo ao lado.</Vazio>
        ) : (
          [...grupos.entries()].map(([grupo, lista]) => (
            <div key={grupo || "todos"} className="border-b border-linha/70 last:border-b-0">
              {grupo && lista.length > 1 && (
                <h3 className="bg-[#F7F9F7] px-5 py-2 text-[13px] font-bold text-tinta-suave" style={{ fontFamily: "inherit", letterSpacing: 0 }}>
                  {grupo}
                </h3>
              )}
              <ul className="divide-y divide-linha/50">
                {lista.map((i) => (
                  <li key={i.nome} className={`flex items-center gap-3 px-4 py-2.5 sm:px-5 ${i.ativo ? "" : "opacity-55"}`}>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold">
                        {grupo && lista.length > 1 && i.nome.includes(":") ? i.nome.slice(grupo.length + 1) : i.nome}
                      </span>
                      <span className="block text-[13px] text-tinta-fraca">
                        {i.usos ? `${i.usos.toLocaleString("pt-BR")} ${i.usos === 1 ? "uso" : "usos"}` : "Ainda sem uso"}
                        {i.ultimoUso && `, último em ${dataBr(i.ultimoUso)}`}
                        {!i.ativo && ", desativado"}
                      </span>
                    </span>
                    <AlternarItem tipo={tipo} nome={i.nome} ativo={i.ativo} />
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
      <aside className="order-1 flex flex-col gap-3 xl:sticky xl:top-8 xl:order-2 xl:self-start">
        <div className="superficie p-5">
          <AdicionarItem tipo={tipo} />
        </div>
        <p className="px-1 text-sm text-tinta-suave">{TEXTOS[tipo].explicacao}</p>
      </aside>
    </div>
  );
}
