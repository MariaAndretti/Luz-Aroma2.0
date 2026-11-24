"use client";

import { useMemo, useState } from "react";
import Modal from "./Modal";
import {
  IMAGEM_BASE,
  ROTULO_SITUACAO,
  formatarData,
  formatarMoeda,
  hojeISO,
  type Pedido,
  type Produto,
  type Situacao,
} from "@/lib/types";

type Props = {
  pedidos: Pedido[];
  produtos: Produto[];
  onAtualizar: () => Promise<void>;
  notificar: (texto: string, tipo?: "ok" | "erro") => void;
};

type CampoOrdem = "id_reserva" | "produtoNome" | "quantidade" | "data" | "total";

const SEM_FILTRO = "todas";

export default function PedidosView({ pedidos, produtos, onAtualizar, notificar }: Props) {
  const [busca, setBusca] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [situacao, setSituacao] = useState<Situacao | typeof SEM_FILTRO>(SEM_FILTRO);
  const [ordem, setOrdem] = useState<{ campo: CampoOrdem; desc: boolean }>({
    campo: "data",
    desc: false,
  });
  const [emEdicao, setEmEdicao] = useState<Pedido | null | undefined>(undefined);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const lista = pedidos.filter((pedido) => {
      const combina =
        !termo ||
        String(pedido.id_reserva).includes(termo) ||
        pedido.produtoNome.toLowerCase().includes(termo) ||
        (pedido.fragrancia ?? "").toLowerCase().includes(termo);
      if (!combina) return false;
      if (de && pedido.data < de) return false;
      if (ate && pedido.data > ate) return false;
      if (situacao !== SEM_FILTRO && pedido.situacao !== situacao) return false;
      return true;
    });

    const fator = ordem.desc ? -1 : 1;
    return lista.sort((a, b) => {
      if (ordem.campo === "produtoNome") return a.produtoNome.localeCompare(b.produtoNome) * fator;
      if (ordem.campo === "data") return a.data.localeCompare(b.data) * fator;
      return ((a[ordem.campo] as number) - (b[ordem.campo] as number)) * fator;
    });
  }, [pedidos, busca, de, ate, situacao, ordem]);

  const totalFiltrado = filtrados.reduce((soma, pedido) => soma + pedido.total, 0);

  function ordenarPor(campo: CampoOrdem) {
    setOrdem((atual) =>
      atual.campo === campo ? { campo, desc: !atual.desc } : { campo, desc: false }
    );
  }

  function seta(campo: CampoOrdem) {
    if (ordem.campo !== campo) return "";
    return ordem.desc ? " ↓" : " ↑";
  }

  function limparFiltros() {
    setBusca("");
    setDe("");
    setAte("");
    setSituacao(SEM_FILTRO);
  }

  async function excluir(pedido: Pedido) {
    const confirmado = window.confirm(
      `Excluir o pedido #${pedido.id_reserva} (${pedido.produtoNome})?\n\nEssa ação não pode ser desfeita.`
    );
    if (!confirmado) return;

    const resposta = await fetch(`/api/reservas/${pedido.id_reserva}`, { method: "DELETE" });
    if (!resposta.ok) {
      const dados = await resposta.json().catch(() => ({}));
      notificar(dados.mensagem ?? "Não foi possível excluir o pedido.", "erro");
      return;
    }
    notificar(`Pedido #${pedido.id_reserva} excluído.`);
    await onAtualizar();
  }

  function exportarCSV() {
    const linhas = [
      ["Pedido", "Produto", "Fragrancia", "Quantidade", "Data", "Situacao", "Valor total"],
      ...filtrados.map((pedido) => [
        String(pedido.id_reserva),
        pedido.produtoNome,
        pedido.fragrancia ?? "",
        String(pedido.quantidade),
        pedido.data,
        ROTULO_SITUACAO[pedido.situacao],
        pedido.total.toFixed(2).replace(".", ","),
      ]),
    ];
    const csv = linhas
      .map((linha) => linha.map((valor) => `"${String(valor).replace(/"/g, '""')}"`).join(";"))
      .join("\r\n");

    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pedidos-luz-aroma-${hojeISO()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    notificar(`${filtrados.length} pedido(s) exportado(s).`);
  }

  return (
    <>
      <section className="painel">
        <div className="barra">
          <div className="campo-busca">
            <input
              className="input"
              placeholder="Buscar por produto, fragrância ou número do pedido"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <div className="filtro-periodo">
            <span>De</span>
            <input className="input" type="date" value={de} onChange={(e) => setDe(e.target.value)} />
            <span>até</span>
            <input className="input" type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
          </div>

          <select
            className="select"
            style={{ width: 170 }}
            value={situacao}
            onChange={(e) => setSituacao(e.target.value as Situacao | typeof SEM_FILTRO)}
          >
            <option value={SEM_FILTRO}>Todas as situações</option>
            <option value="agendado">Agendado</option>
            <option value="hoje">Hoje</option>
            <option value="atrasado">Atrasado</option>
          </select>

          <button className="btn" onClick={limparFiltros}>
            Limpar
          </button>
          <button className="btn" onClick={exportarCSV} disabled={filtrados.length === 0}>
            Exportar CSV
          </button>
          <button className="btn btn-primary" onClick={() => setEmEdicao(null)}>
            + Novo pedido
          </button>
        </div>

        {filtrados.length === 0 ? (
          <div className="vazio">
            {pedidos.length === 0
              ? "Nenhum pedido cadastrado. Clique em “Novo pedido” para começar."
              : "Nenhum pedido encontrado com os filtros atuais."}
          </div>
        ) : (
          <div className="tabela-wrapper">
            <table className="tabela">
              <thead>
                <tr>
                  <th className="ordenavel" onClick={() => ordenarPor("id_reserva")}>
                    Pedido{seta("id_reserva")}
                  </th>
                  <th className="ordenavel" onClick={() => ordenarPor("produtoNome")}>
                    Produto{seta("produtoNome")}
                  </th>
                  <th className="ordenavel" onClick={() => ordenarPor("quantidade")}>
                    Qtd{seta("quantidade")}
                  </th>
                  <th className="ordenavel" onClick={() => ordenarPor("data")}>
                    Data da reserva{seta("data")}
                  </th>
                  <th className="ordenavel numero" onClick={() => ordenarPor("total")}>
                    Valor{seta("total")}
                  </th>
                  <th>Situação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((pedido) => (
                  <tr key={pedido.id_reserva}>
                    <td className="forte">#{pedido.id_reserva}</td>
                    <td>
                      <div className="celula-produto">
                        {pedido.produtoImagem ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            className="miniatura"
                            src={`${IMAGEM_BASE}${pedido.produtoImagem}`}
                            alt={pedido.produtoNome}
                          />
                        ) : (
                          <span className="miniatura" />
                        )}
                        <span>
                          <span className="forte">{pedido.produtoNome}</span>
                          <br />
                          <span className="suave">{pedido.fragrancia || "—"}</span>
                        </span>
                      </div>
                    </td>
                    <td className="forte">{pedido.quantidade}</td>
                    <td>{formatarData(pedido.data)}</td>
                    <td className="numero forte">{formatarMoeda(pedido.total)}</td>
                    <td>
                      <span className={`badge badge-${pedido.situacao}`}>
                        {ROTULO_SITUACAO[pedido.situacao]}
                      </span>
                    </td>
                    <td>
                      <button className="link-btn editar" onClick={() => setEmEdicao(pedido)}>
                        Editar
                      </button>
                      <button className="link-btn" onClick={() => excluir(pedido)}>
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="rodape-tabela">
          <span>
            {filtrados.length} de {pedidos.length} pedido(s)
          </span>
          <span>
            Total filtrado: <strong>{formatarMoeda(totalFiltrado)}</strong>
          </span>
        </div>
      </section>

      {emEdicao !== undefined && (
        <FormularioPedido
          pedido={emEdicao}
          produtos={produtos}
          onFechar={() => setEmEdicao(undefined)}
          onSalvo={async () => {
            setEmEdicao(undefined);
            await onAtualizar();
          }}
          notificar={notificar}
        />
      )}
    </>
  );
}

type FormularioProps = {
  pedido: Pedido | null;
  produtos: Produto[];
  onFechar: () => void;
  onSalvo: () => Promise<void>;
  notificar: (texto: string, tipo?: "ok" | "erro") => void;
};

function FormularioPedido({ pedido, produtos, onFechar, onSalvo, notificar }: FormularioProps) {
  const [idProduto, setIdProduto] = useState(
    String(pedido?.id_produto ?? produtos[0]?.id_produto ?? "")
  );
  const [quantidade, setQuantidade] = useState(String(pedido?.quantidade ?? 1));
  const [data, setData] = useState(pedido?.data ?? hojeISO());
  const [salvando, setSalvando] = useState(false);

  const produto = produtos.find((p) => Number(p.id_produto) === Number(idProduto));
  const preco = Number(produto?.preco ?? 0);
  const total = preco * Number(quantidade || 0);
  const estoque = Number(produto?.quantidade ?? 0);

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();

    if (!produto) {
      notificar("Selecione um produto.", "erro");
      return;
    }
    const qtd = Number(quantidade);
    if (!qtd || qtd <= 0) {
      notificar("Informe uma quantidade válida.", "erro");
      return;
    }
    if (qtd > estoque) {
      notificar(`Estoque insuficiente: disponível ${estoque} unidade(s).`, "erro");
      return;
    }
    if (!data) {
      notificar("Informe a data da reserva.", "erro");
      return;
    }

    setSalvando(true);
    try {
      const resposta = await fetch(pedido ? `/api/reservas/${pedido.id_reserva}` : "/api/reservas", {
        method: pedido ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_produto: Number(produto.id_produto),
          quantidade: qtd,
          data_reserva: data,
        }),
      });

      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => ({}));
        notificar(dados.mensagem ?? "Não foi possível salvar o pedido.", "erro");
        return;
      }

      notificar(pedido ? `Pedido #${pedido.id_reserva} atualizado.` : "Pedido criado com sucesso.");
      await onSalvo();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      titulo={pedido ? `Editar pedido #${pedido.id_reserva}` : "Novo pedido"}
      onFechar={onFechar}
    >
      <form onSubmit={salvar} style={{ display: "contents" }}>
        <div className="campo">
          <label htmlFor="produto">Produto</label>
          <select
            id="produto"
            className="select"
            value={idProduto}
            onChange={(e) => setIdProduto(e.target.value)}
          >
            {produtos.length === 0 && <option value="">Nenhum produto cadastrado</option>}
            {produtos.map((opcao) => (
              <option key={opcao.id_produto} value={opcao.id_produto}>
                {opcao.nome} — {formatarMoeda(opcao.preco)} ({opcao.quantidade} un.)
              </option>
            ))}
          </select>
        </div>

        <div className="grade-2">
          <div className="campo">
            <label htmlFor="quantidade">Quantidade</label>
            <input
              id="quantidade"
              className="input"
              type="number"
              min={1}
              max={estoque || undefined}
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
            />
            <span className="ajuda">{estoque} unidade(s) em estoque</span>
          </div>

          <div className="campo">
            <label htmlFor="data">Data da reserva</label>
            <input
              id="data"
              className="input"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </div>
        </div>

        <div className="resumo">
          <div className="linha">
            <span>Fragrância</span>
            <span>{produto?.fragrancia || "—"}</span>
          </div>
          <div className="linha">
            <span>Preço unitário</span>
            <span>{formatarMoeda(preco)}</span>
          </div>
          <div className="linha destaque">
            <span>Valor total</span>
            <span>{formatarMoeda(total)}</span>
          </div>
        </div>

        <div className="modal-rodape" style={{ padding: 0, border: 0 }}>
          <button type="button" className="btn" onClick={onFechar} disabled={salvando}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={salvando || !produto}>
            {salvando ? "Salvando..." : pedido ? "Salvar alterações" : "Criar pedido"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
