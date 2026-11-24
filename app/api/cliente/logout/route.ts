import { NextResponse } from "next/server";
import { COOKIE_CLIENTE } from "@/lib/auth";

export async function POST() {
  const resposta = NextResponse.json({ ok: true });
  resposta.cookies.set(COOKIE_CLIENTE, "", { path: "/", maxAge: 0 });
  return resposta;
}
