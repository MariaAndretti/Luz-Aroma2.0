import Loja from "@/components/Loja";
import { getCliente } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function PaginaLoja() {
  const cliente = await getCliente();
  return <Loja clienteInicial={cliente} />;
}
