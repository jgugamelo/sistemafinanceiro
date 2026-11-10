import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  // Atalho só para desenvolvimento no próprio computador; ignorado em produção.
  if (process.env.LOGIN_DESATIVADO === "1" && process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }
  const token = await getToken({ req });
  if (token) return NextResponse.next();
  const login = new URL("/login", req.url);
  login.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
