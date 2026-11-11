import { NovoLancamento } from "@/components/Abridores";
import { Nav } from "@/components/Nav";
import { Avisos } from "@/components/ui/Avisos";
import { opcoes } from "@/lib/opcoes";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sugestoes = await opcoes();
  return (
    <div className="min-h-dvh">
      <Nav />
      <main className="px-4 pb-36 pt-5 sm:px-6 lg:ml-[248px] lg:px-8 lg:pb-14 lg:pt-8 2xl:px-12">
        <div className="mx-auto max-w-[1760px]">{children}</div>
      </main>
      <NovoLancamento opcoes={sugestoes} variante="flutuante" />
      <Avisos />
    </div>
  );
}
