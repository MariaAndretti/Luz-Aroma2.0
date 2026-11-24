"use client";

import { useMemo, useState } from "react";
import Modal from "./Modal";
import { IMAGEM_BASE, formatarMoeda, type Produto } from "@/lib/types";

type Props = {
  produtos: Produto[];
  onAtualizar: () => Promise<void>;
  notificar: (texto: string, tipo?: "ok" | "erro") => void;
};

export default function ProdutosView({ produtos, onAtualizar, notificar }: Props) {
  const [busca, setBusca] = useState("");
  const [emEdicao, setEmEdicao] = useState<Produto | null | undefined>(undefined);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return produtos.filter(
      (produto) =>
        !termo ||
        produto.nome.toLowerCase().includes(termo) ||
        (produto.fragrancia ?? "").toLowerCase().includes(termo) ||
        String(produto.id_produto).includes(termo)
    );
  }, [produtos, busca]);

  const valorEstoque = filtrados.reduce(
    (soma, produto) => soma + Number(produto.preco || 0) * Number(produto.quantidade || 0),
    0
  );

  async function excluir(produto: Produto) {
    const confirmado = window.confirm(
      `Excluir o produto “${produto.nome}”?\n\nPedidos já criados com ele continuarão existindo.`
    );
    if (!confirmado) return;

    const resposta = await fetch(`/api/produtos/${produto.id_produto}`, { method: "DELETE" });
    if (!resposta.ok) {
      const dados = await resposta.json().catch(() => ({}));
      notificar(dados.mensagem ?? "Não foi possível excluir o produto.", "erro");
      return;
    }
    notificar(`Produto “${produto.nome}” excluído.`);
    await onAtualizar();
  }

  return (
    <>
      <section className="painel">
        <div className="barra">
          <div className="campo-busca">
            <input
              className="input"
              placeholder="Buscar por nome, fragrância ou código"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setEmEdicao(null)}>
            + Novo produto
          </button>
        </div>

        {filtrados.length === 0 ? (
          <div className="vazio">
            {produtos.length === 0
              ? "Nenhum produto cadastrado."
              : "Nenhum produto encontrado com a busca atual."}
          </div>
        ) : (
          <div className="tabela-wrapper">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Fragrância</th>
                  <th className="numero">Preço</th>
                  <th className="numero">Estoque</th>
                  <th className="numero">Valor em estoque</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((produto) => (
                  <tr key={produto.id_produto}>
                    <td>
                      <div className="celula-produto">
                        {produto.imagem ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            className="miniatura"
                            src={`${IMAGEM_BASE}${produto.imagem}`}
                            alt={produto.nome}
                          />
                        ) : (
                          <span className="miniatura" />
                        )}
                        <span>
                          <span className="forte">{produto.nome}</span>
                          <br />
                          <span className="suave">Código #{produto.id_produto}</span>
                        </span>
                      </div>
                    </td>
                    <td>{produto.fragrancia || "—"}</td>
                    <td className="numero forte">{formatarMoeda(produto.preco)}</td>
                    <td className="numero">
                      <span
                        className={`badge ${Number(produto.quantidade) <= 5 ? "badge-atrasado" : "badge-neutro"}`}
                      >
                        {produto.quantidade} un.
                      </span>
                    </td>
                    <td className="numero">
                      {formatarMoeda(Number(produto.preco || 0) * Number(produto.quantidade || 0))}
                    </td>
                    <td>
                      <button className="link-btn editar" onClick={() => setEmEdicao(produto)}>
                        Editar
                      </button>
                      <button className="link-btn" onClick={() => excluir(produto)}>
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
            {filtrados.length} de {produtos.length} produto(s)
          </span>
          <span>
            Valor em estoque: <strong>{formatarMoeda(valorEstoque)}</strong>
          </span>
        </div>
      </section>

      {emEdicao !== undefined && (
        <FormularioProduto
          produto={emEdicao}
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
  produto: Produto | null;
  onFechar: () => void;
  onSalvo: () => Promise<void>;
  notificar: (texto: string, tipo?: "ok" | "erro") => void;
};

function FormularioProduto({ produto, onFechar, onSalvo, notificar }: FormularioProps) {
  const [nome, setNome] = useState(produto?.nome ?? "");
  const [fragrancia, setFragrancia] = useState(produto?.fragrancia ?? "");
  const [preco, setPreco] = useState(produto ? String(produto.preco) : "");
  const [quantidade, setQuantidade] = useState(String(produto?.quantidade ?? 0));
  const [imagem, setImagem] = useState(produto?.imagem ?? "");
  const [salvando, setSalvando] = useState(false);

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();

    if (!nome.trim()) {
      notificar("Informe o nome do produto.", "erro");
      return;
    }
    const precoNumero = Number(String(preco).replace(",", "."));
    if (!precoNumero || precoNumero <= 0) {
      notificar("Informe um preço válido.", "erro");
      return;
    }

    setSalvando(true);
    try {
      const resposta = await fetch(
        produto ? `/api/produtos/${produto.id_produto}` : "/api/produtos",
        {
          method: produto ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: nome.trim(),
            fragrancia: fragrancia.trim(),
            preco: precoNumero.toFixed(2),
            quantidade: Number(quantidade) || 0,
            imagem: imagem.trim(),
          }),
        }
      );

      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => ({}));
        notificar(dados.mensagem ?? "Não foi possível salvar o produto.", "erro");
        return;
      }

      notificar(produto ? "Produto atualizado." : "Produto criado com sucesso.");
      await onSalvo();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal titulo={produto ? `Editar produto #${produto.id_produto}` : "Novo produto"} onFechar={onFechar}>
      <form onSubmit={salvar} style={{ display: "contents" }}>
        <div className="campo">
          <label htmlFor="nome">Nome</label>
          <input
            id="nome"
            className="input"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Vela Aromática - Vanilla"
          />
        </div>

        <div className="campo">
          <label htmlFor="fragrancia">Fragrância</label>
          <input
            id="fragrancia"
            className="input"
            value={fragrancia}
            onChange={(e) => setFragrancia(e.target.value)}
            placeholder="Baunilha"
          />
        </div>

        <div className="grade-2">
          <div className="campo">
            <label htmlFor="preco">Preço (R$)</label>
            <input
              id="preco"
              className="input"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              placeholder="69.90"
              inputMode="decimal"
            />
          </div>

          <div className="campo">
            <label htmlFor="estoque">Estoque</label>
            <input
              id="estoque"
              className="input"
              type="number"
              min={0}
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
            />
          </div>
        </div>

        <div className="campo">
          <label htmlFor="imagem">Arquivo da imagem</label>
          <input
            id="imagem"
            className="input"
            value={imagem}
            onChange={(e) => setImagem(e.target.value)}
            placeholder="vela9.jpg"
          />
          <span className="ajuda">
            Nome do arquivo publicado em /imagens do site (ex.: vela9.jpg).
          </span>
        </div>

        {imagem.trim() && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="previa" src={`${IMAGEM_BASE}${imagem.trim()}`} alt="Prévia do produto" />
            <span className="suave">Prévia da imagem</span>
          </div>
        )}

        <div className="modal-rodape" style={{ padding: 0, border: 0 }}>
          <button type="button" className="btn" onClick={onFechar} disabled={salvando}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={salvando}>
            {salvando ? "Salvando..." : produto ? "Salvar alterações" : "Criar produto"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
