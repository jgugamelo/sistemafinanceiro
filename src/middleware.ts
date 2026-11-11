import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Três modos, nesta ordem:
 * 1. SENHA_ACESSO definida: o navegador pede usuário e senha (qualquer usuário, a senha é a da variável).
 * 2. LOGIN_DESATIVADO=1: abre sem pedir nada. Qualquer pessoa com o endereço vê os dados.
 * 3. Nenhuma das duas: login com Google, restrito a EMAILS_AUTORIZADOS.
 */
export async function middleware(req: NextRequest) {
  const senha = process.env.SENHA_ACESSO;
  if (senha) {
    const cabecalho = req.headers.get("authorization") || "";
    if (cabecalho.startsWith("Basic ")) {
      const bytes = Uint8Array.from(atob(cabecalho.slice(6)), (c) => c.charCodeAt(0));
      const [, informada = ""] = new TextDecoder().decode(bytes).split(/:(.*)/s);
      if (informada === senha) return NextResponse.next();
    }
    return new NextResponse("Acesso restrito.", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Financeiro", charset="UTF-8"' },
    });
  }

  if (process.env.LOGIN_DESATIVADO === "1") return NextResponse.next();

  const token = await getToken({ req });
  if (token) return NextResponse.next();
  const login = new URL("/login", req.url);
  login.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
