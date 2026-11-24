import { erro, proxy } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  return proxy("/reserva");
}

export async function POST(req: Request) {
  const corpo = await req.json().catch(() => null);
  if (!corpo?.id_produto || !corpo?.quantidade || !corpo?.data_reserva) {
    return erro("Informe o produto, a quantidade e a data da reserva.");
  }
  return proxy("/reserva", { method: "POST", body: corpo });
}
