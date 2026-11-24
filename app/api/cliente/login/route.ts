import { NextResponse } from "next/server";
import { COOKIE_CLIENTE, createSessionToken, opcoesCookie } from "@/lib/auth";

export async function POST(req: Request) {
  let corpo: { email?: string; senha?: string } = {};
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ mensagem: "Requisição inválida." }, { status: 400 });
  }

  const email = (corpo.email ?? "").trim().toLowerCase();
  const senha = corpo.senha ?? "";

  const emailEsperado = (process.env.CLIENTE_EMAIL || "cliente@luzearoma.com").trim().toLowerCase();
  const senhaEsperada = process.env.CLIENTE_SENHA || "velas123";

  if (!email || email !== emailEsperado || senha !== senhaEsperada) {
    return NextResponse.json({ mensagem: "E-mail ou senha incorretos." }, { status: 401 });
  }

  const resposta = NextResponse.json({ email });
  resposta.cookies.set(
    COOKIE_CLIENTE,
    await createSessionToken("cliente", email),
    opcoesCookie(new URL(req.url).protocol)
  );
  return resposta;
}
