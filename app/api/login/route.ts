import { NextResponse } from "next/server";
import { COOKIE_ADMIN, createSessionToken, opcoesCookie } from "@/lib/auth";

export async function POST(req: Request) {
  let corpo: { usuario?: string; senha?: string } = {};
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ mensagem: "Requisição inválida." }, { status: 400 });
  }

  const usuario = (corpo.usuario ?? "").trim();
  const senha = corpo.senha ?? "";

  const usuarioValido = usuario === (process.env.ADMIN_USER || "admin");
  const senhaValida = senha === (process.env.ADMIN_PASSWORD || "luzearoma");

  if (!usuarioValido || !senhaValida) {
    return NextResponse.json({ mensagem: "Usuário ou senha inválidos." }, { status: 401 });
  }

  const resposta = NextResponse.json({ usuario });
  resposta.cookies.set(
    COOKIE_ADMIN,
    await createSessionToken("admin", usuario),
    opcoesCookie(new URL(req.url).protocol)
  );
  return resposta;
}
