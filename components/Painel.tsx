"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { montarPedidos, type Produto, type Reserva } from "@/lib/types";
import PedidosView from "./PedidosView";
import ProdutosView from "./ProdutosView";
import VisaoGeral from "./VisaoGeral";

type Aba = "visao" | "pedidos" | "produtos";
type TipoAviso = "ok" | "erro";
type Aviso = { id: number; texto: string; tipo: TipoAviso };

const TITULOS: Record<Aba, { titulo: string; subtitulo: string }> = {
  visao: { titulo: "Visão geral", subtitulo: "Resumo dos pedidos e do catálogo" },
  pedidos: { titulo: "Pedidos", subtitulo: "Crie, edite e acompanhe as reservas" },
  produtos: { titulo: "Produtos", subtitulo: "Itens disponíveis no catálogo do site" },
};

export default function Painel({ usuario }: { usuario: string }) {
  const router = useRouter();
  const [aba, setAba] = useState<Aba>("visao");
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState<string | null>(null);
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  const notificar = useCallback((texto: string, tipo: TipoAviso = "ok") => {
    const id = Date.now() + Math.random();
    setAvisos((atual) => [...atual, { id, texto, tipo }]);
    setTimeout(() => {
      setAvisos((atual) => atual.filter((aviso) => aviso.id !== id));
    }, 4200);
  }, []);

  const carregar = useCallback(async () => {
    setErroCarga(null);
    try {
      const [respostaProdutos, respostaReservas] = await Promise.all([
        fetch("/api/produtos"),
        fetch("/api/reservas"),
      ]);

      if (respostaProdutos.status === 401 || respostaReservas.status === 401) {
        router.replace("/login");
        return;
      }
      if (!respostaProdutos.ok || !respostaReservas.ok) {
        throw new Error("Não foi possível carregar os dados da API.");
      }

      const listaProdutos = await respostaProdutos.json();
      const listaReservas = await respostaReservas.json();
      setProdutos(Array.isArray(listaProdutos) ? listaProdutos : []);
      setReservas(Array.isArray(listaReservas) ? listaReservas : []);
    } catch (erro) {
      setErroCarga(
        erro instanceof Error ? erro.message : "Falha ao carregar os dados. Tente novamente."
      );
    } finally {
      setCarregando(false);
    }
  }, [router]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const pedidos = useMemo(() => montarPedidos(reservas, produtos), [reservas, produtos]);

  async function sair() {
    await fetch("/api/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          Luz <span>&</span> Aroma
        </div>
        <div className="brand-sub">Painel administrativo</div>

        <nav className="nav">
          <button
            className={`nav-button ${aba === "visao" ? "active" : ""}`}
            onClick={() => setAba("visao")}
          >
            Visão geral
          </button>
          <button
            className={`nav-button ${aba === "pedidos" ? "active" : ""}`}
            onClick={() => setAba("pedidos")}
          >
            Pedidos
            <span className="nav-contador">{pedidos.length}</span>
          </button>
          <button
            className={`nav-button ${aba === "produtos" ? "active" : ""}`}
            onClick={() => setAba("produtos")}
          >
            Produtos
            <span className="nav-contador">{produtos.length}</span>
          </button>
        </nav>

        <div className="sidebar-rodape">
          <div className="rotulo">Conectado como</div>
          <div className="nome">{usuario}</div>
          <button className="btn-sair" onClick={sair}>
            Sair
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div>
            <h1 className="topbar-titulo">{TITULOS[aba].titulo}</h1>
            <div className="topbar-sub">{TITULOS[aba].subtitulo}</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <a className="btn" href="/" target="_blank" rel="noreferrer">
              Ver a loja
            </a>
            <button className="btn" onClick={carregar} disabled={carregando}>
              {carregando ? "Atualizando..." : "Atualizar dados"}
            </button>
          </div>
        </header>

        <main className="content">
          {erroCarga && (
            <div className="aviso-erro">
              {erroCarga}{" "}
              <button className="link-btn editar" onClick={carregar}>
                Tentar novamente
              </button>
            </div>
          )}

          {carregando ? (
            <div className="carregando">Carregando dados da Luz &amp; Aroma...</div>
          ) : (
            <>
              {aba === "visao" && <VisaoGeral pedidos={pedidos} produtos={produtos} />}
              {aba === "pedidos" && (
                <PedidosView
                  pedidos={pedidos}
                  produtos={produtos}
                  onAtualizar={carregar}
                  notificar={notificar}
                />
              )}
              {aba === "produtos" && (
                <ProdutosView
                  produtos={produtos}
                  onAtualizar={carregar}
                  notificar={notificar}
                />
              )}
            </>
          )}
        </main>
      </div>

      {avisos.length > 0 && (
        <div className="avisos">
          {avisos.map((aviso) => (
            <div key={aviso.id} className={`aviso ${aviso.tipo === "erro" ? "erro" : ""}`}>
              {aviso.texto}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
