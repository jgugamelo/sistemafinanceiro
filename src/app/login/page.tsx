"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function Entrar() {
  const busca = useSearchParams();
  const erro = busca.get("error");
  const destino = busca.get("callbackUrl") || "/";

  return (
    <main className="grid min-h-dvh place-items-center bg-tinta px-6">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-marca font-titulo text-xl font-bold text-white">F</span>
        <h1 className="mt-4 font-titulo text-2xl font-semibold">Financeiro</h1>
        <p className="mt-1 text-sm text-tinta/60">Entre com a conta Google autorizada.</p>

        {erro && (
          <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-saida">
            {erro === "AccessDenied"
              ? "Esta conta não tem acesso. Peça para incluírem seu e-mail na lista de autorizados."
              : "Não foi possível entrar. Tente de novo."}
          </p>
        )}

        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: destino })}
          className="mt-6 flex min-h-[48px] w-full items-center justify-center gap-3 rounded-xl bg-tinta px-4 text-sm font-semibold text-white transition-colors hover:bg-tinta/90"
        >
          Entrar com Google
        </button>
      </div>
    </main>
  );
}

export default function Login() {
  return (
    <Suspense>
      <Entrar />
    </Suspense>
  );
}
