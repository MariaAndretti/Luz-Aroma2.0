"use client";

import { useEffect, type ReactNode } from "react";

type Props = {
  titulo: string;
  onFechar: () => void;
  children: ReactNode;
  rodape?: ReactNode;
};

export default function Modal({ titulo, onFechar, children, rodape }: Props) {
  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") onFechar();
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  return (
    <div className="modal-fundo" onClick={onFechar}>
      <div className="modal" onClick={(evento) => evento.stopPropagation()}>
        <div className="modal-cabecalho">
          <h3 className="modal-titulo">{titulo}</h3>
          <button className="fechar" onClick={onFechar} aria-label="Fechar">
            ×
          </button>
        </div>
        <div className="modal-corpo">{children}</div>
        {rodape && <div className="modal-rodape">{rodape}</div>}
      </div>
    </div>
  );
}
