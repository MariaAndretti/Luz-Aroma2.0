import Painel from "@/components/Painel";
import { getAdminUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function PaginaPainel() {
  const usuario = await getAdminUser();
  return <Painel usuario={usuario ?? "admin"} />;
}
