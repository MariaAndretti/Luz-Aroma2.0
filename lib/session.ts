import { cookies } from "next/headers";
import { COOKIE_ADMIN, COOKIE_CLIENTE, verifySessionToken } from "./auth";

/** Usuário do painel administrativo (ou null). */
export async function getAdminUser(): Promise<string | null> {
  const store = await cookies();
  const sessao = await verifySessionToken(store.get(COOKIE_ADMIN)?.value);
  return sessao?.papel === "admin" ? sessao.usuario : null;
}

/** E-mail do cliente que está reservando (ou null). */
export async function getCliente(): Promise<string | null> {
  const store = await cookies();
  const sessao = await verifySessionToken(store.get(COOKIE_CLIENTE)?.value);
  return sessao?.papel === "cliente" ? sessao.usuario : null;
}
