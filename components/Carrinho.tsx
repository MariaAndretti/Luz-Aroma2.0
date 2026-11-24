"use client";

import { useState } from "react";
import { IMAGEM_BASE, formatarMoeda, formatarData, hojeISO, type Produto, type Reserva } from "@/lib/types";

type Item = { produto: Produto; quantidade: number };

type Props = {
  itens: Item[];
  total: number;
  cliente: string | null;
  onClienteAtualizado: (email: string | null) => void;
  onAlterarQuantidade: (id: number, quantidade: number) => void;
  onRemover: (id: number) => void;
  onLimpar: () => void;
  onFechar: () => void;
};

type Etapa = "itens" | "login" | "confirmado";

type Resultado = {
  reservas: Reserva[];
  falhas: string[];
  nomes: Record<number, string>;
  total: number;
  data: string;
};

export default function Carrinho({
  itens,
  total,
  cliente,
  onClienteAtualizado,
  onAlterarQuantidade,
  onRemover,
  onLimpar,
  onFechar,
}: Props) {
  const [etapa, setEtapa] = useState<Etapa>("itens");
  const [data, setData] = useState(hojeISO());
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  async function entrar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const resposta = await fetch("/api/cliente/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) {
        setErro(dados.mensagem ?? "Não foi possível entrar.");
        return;
      }
      onClienteAtualizado(dados.email ?? email);
      await enviarPedido();
    } catch {
      setErro("Falha de conexão. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  async function enviarPedido() {
    setErro(null);
    setEnviando(true);
    const nomes: Record<number, string> = {};
    itens.forEach((item) => {
      nomes[item.produto.id_produto] = item.produto.nome;
    });

    try {
      const resposta = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data_reserva: data,
          itens: itens.map((item) => ({
            id_produto: item.produto.id_produto,
            quantidade: item.quantidade,
          })),
        }),
      });
      const dados = await resposta.json().catch(() => ({}));

      if (resposta.status === 401) {
        setEtapa("login");
        setErro(dados.mensagem ?? "Faça login para concluir a reserva.");
        return;
      }
      if (!resposta.ok) {
        setErro(dados.mensagem ?? "Não foi possível concluir a reserva.");
        return;
      }

      setResultado({
        reservas: dados.reservas ?? [],
        falhas: dados.falhas ?? [],
        nomes,
        total,
        data,
      });
      onLimpar();
      setEtapa("confirmado");
    } catch {
      setErro("Falha de conexão. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  async function trocarConta() {
    await fetch("/api/cliente/logout", { method: "POST" });
    onClienteAtualizado(null);
    setEmail("");
    setSenha("");
  }

  function finalizar() {
    setErro(null);
    if (itens.length === 0) return;
    if (cliente) {
      enviarPedido();
      return;
    }
    setEtapa("login");
  }

  return (
    <div className="carrinho-fundo" onClick={onFechar}>
      <aside className="carrinho" onClick={(evento) => evento.stopPropagation()}>
        <div className="carrinho-topo">
          <h2 className="carrinho-titulo">
            {etapa === "confirmado" ? "Reserva confirmada" : etapa === "login" ? "Entrar para reservar" : "Seu pedido"}
          </h2>
          <button className="fechar" onClick={onFechar} aria-label="Fechar">
            ×
          </button>
        </div>

        <div className="carrinho-corpo">
          {erro && <div className="login-erro">{erro}</div>}

          {etapa === "confirmado" && resultado && (
            <div className="sucesso">
              <div className="sucesso-icone">✓</div>
              <h3>Reserva registrada para {formatarData(resultado.data)}</h3>
              <p className="suave">
                Guarde o número de cada reserva. O pagamento é combinado na retirada.
              </p>

              <div className="sucesso-lista">
                {resultado.reservas.map((reserva) => (
                  <div className="linha" key={reserva.id_reserva}>
                    <span>
                      <strong>#{reserva.id_reserva}</strong> · {resultado.nomes[reserva.id_produto] ?? `Produto ${reserva.id_produto}`}
                      <br />
                      <span className="suave">
                        {reserva.quantidade} un. · {reserva.fragrancia}
                      </span>
                    </span>
                    <strong>{formatarMoeda(reserva.valor_total)}</strong>
                  </div>
                ))}
              </div>

              {resultado.falhas.length > 0 && (
                <div className="login-erro">
                  Alguns itens não puderam ser reservados:
                  <ul style={{ margin: "6px 0 0 18px", padding: 0 }}>
                    {resultado.falhas.map((falha) => (
                      <li key={falha}>{falha}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="linha destaque">
                <span>Total reservado</span>
                <span>
                  {formatarMoeda(
                    resultado.reservas.reduce((soma, r) => soma + Number(r.valor_total || 0), 0)
                  )}
                </span>
              </div>

              <button className="btn btn-primary" onClick={onFechar}>
                Fazer novo pedido
              </button>
            </div>
          )}

          {etapa === "login" && (
            <form onSubmit={entrar} className="etapa-login">
              <p className="suave">
                Para concluir a reserva, entre com o e-mail e a senha de acesso da Luz &amp; Aroma.
              </p>

              <div className="campo">
                <label htmlFor="email">E-mail</label>
                <input
                  id="email"
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@email.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="campo">
                <label htmlFor="senhaLogin">Senha</label>
                <input
                  id="senhaLogin"
                  className="input"
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Sua senha"
                  autoComplete="current-password"
                  required
                />
              </div>

              <div className="resumo">
                <div className="linha">
                  <span>Itens</span>
                  <span>{itens.reduce((soma, item) => soma + item.quantidade, 0)}</span>
                </div>
                <div className="linha destaque">
                  <span>Total</span>
                  <span>{formatarMoeda(total)}</span>
                </div>
              </div>

              <button className="btn btn-primary" type="submit" disabled={enviando}>
                {enviando ? "Confirmando..." : "Entrar e confirmar reserva"}
              </button>
              <button
                className="btn"
                type="button"
                onClick={() => setEtapa("itens")}
                disabled={enviando}
              >
                Voltar ao pedido
              </button>
            </form>
          )}

          {etapa === "itens" &&
            (itens.length === 0 ? (
              <div className="vazio">
                Seu carrinho está vazio.
                <br />
                Escolha uma vela no catálogo para começar.
              </div>
            ) : (
              <>
                {itens.map((item) => (
                  <div className="item-carrinho" key={item.produto.id_produto}>
                    {item.produto.imagem ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        className="item-foto"
                        src={`${IMAGEM_BASE}${item.produto.imagem}`}
                        alt={item.produto.nome}
                      />
                    ) : (
                      <span className="item-foto" />
                    )}

                    <div className="item-info">
                      <strong>{item.produto.nome}</strong>
                      <span className="suave">
                        {item.produto.fragrancia} · {formatarMoeda(item.produto.preco)} / un.
                      </span>

                      <div className="item-acoes">
                        <div className="seletor-qtd">
                          <button
                            type="button"
                            className="qtd-btn"
                            onClick={() =>
                              onAlterarQuantidade(item.produto.id_produto, item.quantidade - 1)
                            }
                            aria-label="Diminuir"
                          >
                            −
                          </button>
                          <span className="qtd-valor">{item.quantidade}</span>
                          <button
                            type="button"
                            className="qtd-btn"
                            onClick={() =>
                              onAlterarQuantidade(
                                item.produto.id_produto,
                                Math.min(Number(item.produto.quantidade || 1), item.quantidade + 1)
                              )
                            }
                            aria-label="Aumentar"
                          >
                            +
                          </button>
                        </div>
                        <button
                          className="link-btn"
                          onClick={() => onRemover(item.produto.id_produto)}
                        >
                          Remover
                        </button>
                      </div>
                    </div>

                    <div className="item-total">
                      {formatarMoeda(item.quantidade * Number(item.produto.preco || 0))}
                    </div>
                  </div>
                ))}

                <div className="campo">
                  <label htmlFor="dataReserva">Data da reserva</label>
                  <input
                    id="dataReserva"
                    className="input"
                    type="date"
                    min={hojeISO()}
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                  />
                  <span className="ajuda">
                    A data escolhida vale para todos os itens deste pedido.
                  </span>
                </div>
              </>
            ))}
        </div>

        {etapa === "itens" && itens.length > 0 && (
          <div className="carrinho-rodape">
            <div className="linha destaque">
              <span>Total</span>
              <span>{formatarMoeda(total)}</span>
            </div>

            {cliente ? (
              <p className="suave" style={{ margin: 0 }}>
                Reservando como <strong>{cliente}</strong>{" "}
                <button className="link-btn editar" onClick={trocarConta}>
                  trocar
                </button>
              </p>
            ) : (
              <p className="suave" style={{ margin: 0 }}>
                Você entrará com e-mail e senha ao confirmar.
              </p>
            )}

            <button className="btn btn-primary" onClick={finalizar} disabled={enviando}>
              {enviando ? "Enviando..." : "Finalizar reserva"}
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
