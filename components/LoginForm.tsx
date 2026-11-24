"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  async function entrar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);
    setEntrando(true);
    try {
      const resposta = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, senha }),
      });
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) {
        setErro(dados.mensagem ?? "Não foi possível entrar.");
        return;
      }
      router.replace("/painel");
      router.refresh();
    } catch {
      setErro("Falha de conexão. Tente novamente.");
    } finally {
      setEntrando(false);
    }
  }

  return (
    <div className="login-tela">
      <div className="login-caixa">
        <h1 className="login-marca">
          Luz <span>&</span> Aroma
        </h1>
        <p className="login-sub">Painel administrativo de pedidos</p>

        {erro && <div className="login-erro">{erro}</div>}

        <form onSubmit={entrar} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="campo">
            <label htmlFor="usuario">Usuário</label>
            <input
              id="usuario"
              className="input"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Digite seu usuário"
              autoComplete="username"
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              className="input"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite sua senha"
              autoComplete="current-password"
              required
            />
          </div>

          <button className="btn btn-primary" type="submit" disabled={entrando}>
            {entrando ? "Entrando..." : "Entrar no painel"}
          </button>
        </form>

        <p className="login-dica">
          Credenciais padrão: <strong>admin</strong> / <strong>luzearoma</strong> — altere nas variáveis
          de ambiente antes de publicar.
          <br />
          <a className="link-btn editar" href="/">
            Ir para a loja
          </a>
        </p>
      </div>
    </div>
  );
}
