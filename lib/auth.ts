const encoder = new TextEncoder();

export type Papel = "admin" | "cliente";

/** Cookie da sessão do painel administrativo. */
export const COOKIE_ADMIN = "la_session";
/** Cookie da sessão do cliente que está reservando. */
export const COOKIE_CLIENTE = "la_cliente";

export const SESSION_MAX_AGE = 60 * 60 * 12; // 12 horas

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): string {
  return atob(value.replace(/-/g, "+").replace(/_/g, "/"));
}

function secret(): string {
  return process.env.AUTH_SECRET || "luz-e-aroma-dev-secret";
}

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return toBase64Url(new Uint8Array(signature));
}

/** Gera um token de sessão assinado (HMAC-SHA256) com validade definida. */
export async function createSessionToken(papel: Papel, usuario: string): Promise<string> {
  const payload = `${papel}:${usuario}:${Date.now() + SESSION_MAX_AGE * 1000}`;
  return `${toBase64Url(encoder.encode(payload))}.${await sign(payload)}`;
}

/** Valida o token e devolve papel + usuário, ou null se for inválido/expirado. */
export async function verifySessionToken(
  token: string | undefined | null
): Promise<{ papel: Papel; usuario: string } | null> {
  if (!token) return null;

  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  let payload: string;
  try {
    payload = fromBase64Url(body);
  } catch {
    return null;
  }

  if ((await sign(payload)) !== signature) return null;

  const [papel, usuario, expiraEm] = payload.split(":");
  if (!papel || !usuario || !expiraEm || Number(expiraEm) < Date.now()) return null;
  if (papel !== "admin" && papel !== "cliente") return null;

  return { papel, usuario };
}

/** Opções do cookie de sessão (Secure apenas em HTTPS). */
export function opcoesCookie(protocolo: string) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: protocolo === "https:",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}
