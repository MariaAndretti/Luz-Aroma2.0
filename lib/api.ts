import { NextResponse } from "next/server";

export const API_BASE = (
  process.env.API_BASE_URL || "https://luz-e-aroma.onrender.com"
).replace(/\/+$/, "");

type ProxyInit = {
  method?: string;
  body?: unknown;
};

/**
 * Repassa a requisição para a API do site e devolve a resposta como JSON.
 * A URL da API fica apenas no servidor, nunca é exposta ao navegador.
 */
export async function proxy(path: string, init: ProxyInit = {}): Promise<NextResponse> {
  try {
    const resposta = await fetch(`${API_BASE}${path}`, {
      method: init.method ?? "GET",
      headers: { "Content-Type": "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
    });

    const texto = await resposta.text();
    let dados: unknown = null;
    try {
      dados = texto ? JSON.parse(texto) : null;
    } catch {
      dados = { mensagem: texto };
    }

    return NextResponse.json(dados ?? {}, { status: resposta.status });
  } catch {
    return NextResponse.json(
      { mensagem: "Não foi possível conectar à API do site." },
      { status: 502 }
    );
  }
}

/** Resposta JSON de erro padronizada. */
export function erro(mensagem: string, status = 400): NextResponse {
  return NextResponse.json({ mensagem }, { status });
}
