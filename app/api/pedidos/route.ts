import { NextResponse, type NextRequest } from "next/server";
import { API_BASE } from "@/lib/api";
import { COOKIE_CLIENTE, verifySessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Item = { id_produto: number; quantidade: number };

const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Fecha o pedido do cliente: cria uma reserva por item do carrinho.
 * O nome do cliente não é gravado porque a API do site não possui esse campo.
 */
export async function POST(req: NextRequest) {
  const sessao = await verifySessionToken(req.cookies.get(COOKIE_CLIENTE)?.value);
  if (sessao?.papel !== "cliente") {
    return NextResponse.json({ mensagem: "Faça login para concluir a reserva." }, { status: 401 });
  }

  let corpo: { data_reserva?: string; itens?: Item[] } = {};
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ mensagem: "Requisição inválida." }, { status: 400 });
  }

  const data = corpo.data_reserva ?? "";
  const itens = Array.isArray(corpo.itens) ? corpo.itens : [];

  if (!FORMATO_DATA.test(data)) {
    return NextResponse.json({ mensagem: "Informe a data da reserva." }, { status: 400 });
  }
  const itensValidos = itens.filter(
    (item) => Number(item?.id_produto) > 0 && Number(item?.quantidade) > 0
  );
  if (itensValidos.length === 0) {
    return NextResponse.json({ mensagem: "Adicione ao menos um produto ao pedido." }, { status: 400 });
  }

  const reservas: unknown[] = [];
  const falhas: string[] = [];

  for (const item of itensValidos) {
    try {
      const resposta = await fetch(`${API_BASE}/reserva`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_produto: Number(item.id_produto),
          quantidade: Number(item.quantidade),
          data_reserva: data,
        }),
        cache: "no-store",
      });

      if (!resposta.ok) {
        falhas.push(`Produto ${item.id_produto}: não foi possível reservar.`);
        continue;
      }
      reservas.push(await resposta.json());
    } catch {
      falhas.push(`Produto ${item.id_produto}: falha de conexão com a API.`);
    }
  }

  if (reservas.length === 0) {
    return NextResponse.json(
      { mensagem: "Não foi possível criar as reservas.", falhas },
      { status: 502 }
    );
  }

  return NextResponse.json({ reservas, falhas }, { status: 201 });
}
