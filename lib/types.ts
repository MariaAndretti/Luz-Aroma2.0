export type Produto = {
  id_produto: number;
  nome: string;
  preco: string;
  quantidade: number;
  fragrancia: string;
  imagem: string;
};

export type Reserva = {
  id_reserva: number;
  quantidade: number;
  fragrancia: string;
  data_reserva: string;
  id_produto: number;
  valor_total: string;
};

/** Situação do pedido deduzida da data da reserva (a API não possui campo de status). */
export type Situacao = "atrasado" | "hoje" | "agendado";

export type Pedido = Reserva & {
  produtoNome: string;
  produtoImagem: string;
  data: string;
  total: number;
  situacao: Situacao;
};

export const IMAGEM_BASE = "https://luz-e-aroma-self.vercel.app/imagens/";

export function formatarMoeda(valor: number | string): string {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** Converte ISO (UTC) para "YYYY-MM-DD" sem sofrer deslocamento de fuso. */
export function dataISO(valor: string): string {
  return (valor || "").slice(0, 10);
}

export function formatarData(valor: string): string {
  const iso = dataISO(valor);
  const [ano, mes, dia] = iso.split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : "—";
}

export function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function situacaoDa(data: string): Situacao {
  const iso = dataISO(data);
  const hoje = hojeISO();
  if (iso < hoje) return "atrasado";
  if (iso === hoje) return "hoje";
  return "agendado";
}

export const ROTULO_SITUACAO: Record<Situacao, string> = {
  atrasado: "Atrasado",
  hoje: "Hoje",
  agendado: "Agendado",
};

/** Junta reservas e produtos em pedidos prontos para exibição. */
export function montarPedidos(reservas: Reserva[], produtos: Produto[]): Pedido[] {
  const porId = new Map(produtos.map((p) => [Number(p.id_produto), p]));
  return reservas.map((r) => {
    const produto = porId.get(Number(r.id_produto));
    return {
      ...r,
      produtoNome: produto?.nome ?? `Produto #${r.id_produto}`,
      produtoImagem: produto?.imagem ?? "",
      data: dataISO(r.data_reserva),
      total: Number(r.valor_total || 0),
      situacao: situacaoDa(r.data_reserva),
    };
  });
}
