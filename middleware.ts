import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_ADMIN, COOKIE_CLIENTE, verifySessionToken } from "./lib/auth";

/** Rotas do painel administrativo (exigem sessão de admin). */
function ehRotaDoPainel(pathname: string): boolean {
  return (
    pathname === "/painel" ||
    pathname.startsWith("/api/produtos") ||
    pathname.startsWith("/api/reservas")
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const admin = await verifySessionToken(req.cookies.get(COOKIE_ADMIN)?.value);
  const cliente = await verifySessionToken(req.cookies.get(COOKIE_CLIENTE)?.value);
  const adminLogado = admin?.papel === "admin";
  const clienteLogado = cliente?.papel === "cliente";

  if (pathname === "/login") {
    return adminLogado ? NextResponse.redirect(new URL("/painel", req.url)) : NextResponse.next();
  }

  if (ehRotaDoPainel(pathname)) {
    if (adminLogado) return NextResponse.next();
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ mensagem: "Faça login no painel para continuar." }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Criar reservas em nome do cliente exige a sessão de cliente.
  if (pathname === "/api/pedidos" && !clienteLogado) {
    return NextResponse.json({ mensagem: "Faça login para concluir a reserva." }, { status: 401 });
  }

  // Loja, catálogo e telas de login ficam abertos.
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/painel", "/api/:path*"],
};
