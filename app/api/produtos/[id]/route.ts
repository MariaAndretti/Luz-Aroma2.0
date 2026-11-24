import { erro, proxy } from "@/lib/api";

export const dynamic = "force-dynamic";

type Contexto = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Contexto) {
  const { id } = await params;
  const corpo = await req.json().catch(() => null);
  if (!corpo?.nome || corpo?.preco === undefined || corpo?.preco === null) {
    return erro("Informe ao menos o nome e o preço do produto.");
  }
  // A API substitui o registro inteiro, por isso enviamos todos os campos.
  return proxy(`/produto/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: {
      nome: corpo.nome,
      preco: String(corpo.preco),
      quantidade: Number(corpo.quantidade ?? 0),
      fragrancia: corpo.fragrancia ?? "",
      imagem: corpo.imagem ?? "",
    },
  });
}

export async function DELETE(_req: Request, { params }: Contexto) {
  const { id } = await params;
  return proxy(`/produto/${encodeURIComponent(id)}`, { method: "DELETE" });
}
