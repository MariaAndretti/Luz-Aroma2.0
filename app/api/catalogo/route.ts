import { proxy } from "@/lib/api";

export const dynamic = "force-dynamic";

/** Catálogo público usado pela loja (sem dados sensíveis). */
export async function GET() {
  return proxy("/produto");
}
