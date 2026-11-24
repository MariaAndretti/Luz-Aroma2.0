import { erro, proxy } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  return proxy("/produto");
}

export async function POST(req: Request) {
  const corpo = await req.json().catch(() => null);
  if (!corpo?.nome || corpo?.preco === undefined || corpo?.preco === null) {
    return erro("Informe ao menos o nome e o preço do produto.");
  }
  return proxy("/produto", { method: "POST", body: corpo });
}
