import { erro, proxy } from "@/lib/api";

export const dynamic = "force-dynamic";

type Contexto = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Contexto) {
  const { id } = await params;
  const corpo = await req.json().catch(() => null);
  if (!corpo?.id_produto || !corpo?.quantidade || !corpo?.data_reserva) {
    return erro("Informe o produto, a quantidade e a data da reserva.");
  }
  return proxy(`/reserva/${encodeURIComponent(id)}`, { method: "PUT", body: corpo });
}

export async function DELETE(_req: Request, { params }: Contexto) {
  const { id } = await params;
  return proxy(`/reserva/${encodeURIComponent(id)}`, { method: "DELETE" });
}
