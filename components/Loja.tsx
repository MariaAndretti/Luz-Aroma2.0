"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Carrinho from "./Carrinho";
import { IMAGEM_BASE, formatarMoeda, type Produto } from "@/lib/types";

const TODAS = "todas";

export default function Loja({ clienteInicial }: { clienteInicial: string | null }) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [fragrancia, setFragrancia] = useState(TODAS);
  const [escolhidas, setEscolhidas] = useState<Record<number, number>>({});
  const [quantidades, setQuantidades] = useState<Record<number, number>>({});
  const [cliente, setCliente] = useState(clienteInicial);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);

  const carregar = useCallback(async () => {
    setErro(null);
    setCarregando(true);
    try {
      const resposta = await fetch("/api/catalogo");
      if (!resposta.ok) throw new Error("Não foi possível carregar o catálogo.");
      const dados = await resposta.json();
      setProdutos(Array.isArray(dados) ? dados : []);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Falha ao carregar o catálogo.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const fragrancias = useMemo(
    () =>
      [...new Set(produtos.map((produto) => produto.fragrancia).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [produtos]
  );

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return produtos.filter((produto) => {
      if (fragrancia !== TODAS && produto.fragrancia !== fragrancia) return false;
      if (!termo) return true;
      return (
        produto.nome.toLowerCase().includes(termo) ||
        (produto.fragrancia ?? "").toLowerCase().includes(termo)
      );
    });
  }, [produtos, busca, fragrancia]);

  const itens = useMemo(
    () =>
      Object.entries(quantidades)
        .map(([id, quantidade]) => ({
          produto: produtos.find((p) => Number(p.id_produto) === Number(id)),
          quantidade,
        }))
        .filter((item): item is { produto: Produto; quantidade: number } => Boolean(item.produto)),
    [quantidades, produtos]
  );

  const totalItens = itens.reduce((soma, item) => soma + item.quantidade, 0);
  const totalPedido = itens.reduce(
    (soma, item) => soma + item.quantidade * Number(item.produto.preco || 0),
    0
  );

  function adicionar(produto: Produto) {
    const selecionada = escolhidas[produto.id_produto] ?? 1;
    setQuantidades((atual) => {
      const jaNoCarrinho = atual[produto.id_produto] ?? 0;
      const limite = Math.max(1, Number(produto.quantidade || 1));
      const nova = Math.min(jaNoCarrinho + selecionada, limite);
      return { ...atual, [produto.id_produto]: nova };
    });
    setCarrinhoAberto(true);
  }

  function alterarQuantidade(id: number, quantidade: number) {
    if (quantidade <= 0) {
      setQuantidades((atual) => {
        const copia = { ...atual };
        delete copia[id];
        return copia;
      });
      return;
    }
    setQuantidades((atual) => ({ ...atual, [id]: quantidade }));
  }

  return (
    <div className="loja">
      <header className="loja-topo">
        <div className="loja-topo-interna">
          <a className="loja-marca" href="/">
            Luz <span>&</span> Aroma
          </a>
          <div className="loja-acoes">
            <a className="link-suave" href="/login">
              Área do administrador
            </a>
            <button className="btn-carrinho" onClick={() => setCarrinhoAberto(true)}>
              Carrinho
              {totalItens > 0 && <span className="contador-carrinho">{totalItens}</span>}
            </button>
          </div>
        </div>
      </header>

      <section className="hero">
        <h1 className="hero-titulo">Velas artesanais para transformar o seu espaço</h1>
        <p className="hero-sub">
          Monte seu pedido, escolha a data e confirme a reserva. O pagamento é combinado na retirada.
        </p>
      </section>

      <main className="loja-corpo">
        {erro && <div className="aviso-erro">{erro}</div>}

        <div className="vitrine-barra">
          <input
            className="input"
            placeholder="O que você procura? Ex.: baunilha, lavanda..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <select
            className="select"
            style={{ width: 220 }}
            value={fragrancia}
            onChange={(e) => setFragrancia(e.target.value)}
          >
            <option value={TODAS}>Todas as fragrâncias</option>
            {fragrancias.map((opcao) => (
              <option key={opcao} value={opcao}>
                {opcao}
              </option>
            ))}
          </select>
          <span className="suave">
            {filtrados.length} de {produtos.length} produto(s)
          </span>
        </div>

        {carregando ? (
          <div className="carregando">Carregando o catálogo...</div>
        ) : filtrados.length === 0 ? (
          <div className="vazio">Nenhum produto encontrado.</div>
        ) : (
          <div className="grade-produtos">
            {filtrados.map((produto) => {
              const semEstoque = Number(produto.quantidade) <= 0;
              const escolhida = escolhidas[produto.id_produto] ?? 1;
              return (
                <article className="produto-card" key={produto.id_produto}>
                  <div className="produto-foto">
                    {produto.imagem ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`${IMAGEM_BASE}${produto.imagem}`} alt={produto.nome} />
                    ) : (
                      <span className="produto-sem-foto">Luz &amp; Aroma</span>
                    )}
                    <span className={`selo-estoque ${semEstoque ? "zerado" : ""}`}>
                      {semEstoque ? "Esgotado" : `${produto.quantidade} disponíveis`}
                    </span>
                  </div>

                  <div className="produto-info">
                    <h3 className="produto-nome">{produto.nome}</h3>
                    <p className="produto-fragrancia">{produto.fragrancia || "Sem fragrância"}</p>
                    <p className="produto-preco">{formatarMoeda(produto.preco)}</p>

                    <div className="produto-acoes">
                      <div className="seletor-qtd">
                        <button
                          type="button"
                          className="qtd-btn"
                          onClick={() =>
                            setEscolhidas((atual) => ({
                              ...atual,
                              [produto.id_produto]: Math.max(1, escolhida - 1),
                            }))
                          }
                          disabled={semEstoque}
                          aria-label="Diminuir"
                        >
                          −
                        </button>
                        <span className="qtd-valor">{escolhida}</span>
                        <button
                          type="button"
                          className="qtd-btn"
                          onClick={() =>
                            setEscolhidas((atual) => ({
                              ...atual,
                              [produto.id_produto]: Math.min(
                                Math.max(1, Number(produto.quantidade || 1)),
                                escolhida + 1
                              ),
                            }))
                          }
                          disabled={semEstoque}
                          aria-label="Aumentar"
                        >
                          +
                        </button>
                      </div>
                      <button
                        className="btn btn-primary"
                        onClick={() => adicionar(produto)}
                        disabled={semEstoque}
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {carrinhoAberto && (
        <Carrinho
          itens={itens}
          total={totalPedido}
          cliente={cliente}
          onClienteAtualizado={setCliente}
          onAlterarQuantidade={alterarQuantidade}
          onRemover={(id) => alterarQuantidade(id, 0)}
          onLimpar={() => setQuantidades({})}
          onFechar={() => setCarrinhoAberto(false)}
        />
      )}

      <footer className="loja-rodape">
        Luz &amp; Aroma · Velas artesanais · Reservas sujeitas à confirmação
      </footer>
    </div>
  );
}
