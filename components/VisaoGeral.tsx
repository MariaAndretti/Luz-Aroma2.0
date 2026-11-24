"use client";

import { formatarData, formatarMoeda, ROTULO_SITUACAO, type Pedido, type Produto } from "@/lib/types";

type Props = {
  pedidos: Pedido[];
  produtos: Produto[];
};

export default function VisaoGeral({ pedidos, produtos }: Props) {
  const faturamento = pedidos.reduce((soma, p) => soma + p.total, 0);
  const unidades = pedidos.reduce((soma, p) => soma + p.quantidade, 0);
  const ticketMedio = pedidos.length ? faturamento / pedidos.length : 0;
  const atrasados = pedidos.filter((p) => p.situacao === "atrasado");
  const agendados = pedidos.filter((p) => p.situacao !== "atrasado");

  const valorEstoque = produtos.reduce(
    (soma, p) => soma + Number(p.preco || 0) * Number(p.quantidade || 0),
    0
  );
  const unidadesEstoque = produtos.reduce((soma, p) => soma + Number(p.quantidade || 0), 0);

  const porProduto = new Map<string, { nome: string; pedidos: number; unidades: number; valor: number }>();
  for (const pedido of pedidos) {
    const atual = porProduto.get(pedido.produtoNome) ?? {
      nome: pedido.produtoNome,
      pedidos: 0,
      unidades: 0,
      valor: 0,
    };
    atual.pedidos += 1;
    atual.unidades += pedido.quantidade;
    atual.valor += pedido.total;
    porProduto.set(pedido.produtoNome, atual);
  }

  const maisPedidos = [...porProduto.values()].sort((a, b) => b.valor - a.valor).slice(0, 6);
  const proximos = [...agendados].sort((a, b) => a.data.localeCompare(b.data)).slice(0, 6);
  const menorEstoque = [...produtos]
    .sort((a, b) => Number(a.quantidade) - Number(b.quantidade))
    .slice(0, 6);

  return (
    <>
      <div className="cartoes">
        <div className="cartao">
          <div className="rotulo">Pedidos</div>
          <div className="valor">{pedidos.length}</div>
          <div className="detalhe">{unidades} unidades reservadas</div>
        </div>
        <div className="cartao ok">
          <div className="rotulo">Faturamento reservado</div>
          <div className="valor">{formatarMoeda(faturamento)}</div>
          <div className="detalhe">Ticket médio {formatarMoeda(ticketMedio)}</div>
        </div>
        <div className="cartao alerta">
          <div className="rotulo">Agendados</div>
          <div className="valor">{agendados.length}</div>
          <div className="detalhe">Reservas para hoje ou datas futuras</div>
        </div>
        <div className="cartao perigo">
          <div className="rotulo">Atrasados</div>
          <div className="valor">{atrasados.length}</div>
          <div className="detalhe">Datas já vencidas sem conclusão</div>
        </div>
        <div className="cartao">
          <div className="rotulo">Catálogo</div>
          <div className="valor">{produtos.length}</div>
          <div className="detalhe">
            {unidadesEstoque} un. em estoque · {formatarMoeda(valorEstoque)}
          </div>
        </div>
      </div>

      <div className="colunas">
        <section className="painel">
          <div className="painel-cabecalho">
            <h3 className="painel-titulo">Produtos mais reservados</h3>
          </div>
          <div className="painel-corpo">
            {maisPedidos.length === 0 && <p className="suave">Nenhum pedido registrado ainda.</p>}
            {maisPedidos.map((item, indice) => (
              <div className="rank-linha" key={item.nome}>
                <span className="rank-posicao">{indice + 1}</span>
                <span className="rank-nome" title={item.nome}>
                  {item.nome}
                </span>
                <span className="rank-valores">
                  {item.pedidos} pedido(s) · {item.unidades} un.
                  <br />
                  <strong>{formatarMoeda(item.valor)}</strong>
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="painel">
          <div className="painel-cabecalho">
            <h3 className="painel-titulo">Próximas reservas</h3>
          </div>
          <div className="painel-corpo">
            {proximos.length === 0 && <p className="suave">Sem reservas agendadas.</p>}
            {proximos.map((pedido) => (
              <div className="rank-linha" key={pedido.id_reserva}>
                <span className={`badge badge-${pedido.situacao}`}>
                  {ROTULO_SITUACAO[pedido.situacao]}
                </span>
                <span className="rank-nome" title={pedido.produtoNome}>
                  {pedido.produtoNome}
                </span>
                <span className="rank-valores">
                  {formatarData(pedido.data)} · {pedido.quantidade} un.
                  <br />
                  <strong>{formatarMoeda(pedido.total)}</strong>
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="painel" style={{ gridColumn: "1 / -1" }}>
          <div className="painel-cabecalho">
            <h3 className="painel-titulo">Estoque mais baixo</h3>
          </div>
          <div className="painel-corpo">
            {menorEstoque.length === 0 && <p className="suave">Nenhum produto cadastrado.</p>}
            {menorEstoque.map((produto) => (
              <div className="rank-linha" key={produto.id_produto}>
                <span className="rank-nome" title={produto.nome}>
                  {produto.nome} <span className="suave">· {produto.fragrancia}</span>
                </span>
                <span className="rank-valores">
                  <span className={`badge ${Number(produto.quantidade) <= 5 ? "badge-atrasado" : "badge-neutro"}`}>
                    {produto.quantidade} un.
                  </span>{" "}
                  {formatarMoeda(produto.preco)}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
