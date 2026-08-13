"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

/* Linha de lista que abre uma folha de edição pré-preenchida ao toque.
   A folha vai para o <body> via portal — assim não interfere nas regras
   de borda das linhas dentro do card. */
export default function LinhaComEdicao({
  titulo,
  action,
  classeLinha = "row",
  linha,
  campos,
}: {
  titulo: string;
  action: (fd: FormData) => Promise<void>;
  classeLinha?: string;
  linha: React.ReactNode;
  campos: React.ReactNode;
}) {
  const [aberta, setAberta] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const montada = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  async function enviar(fd: FormData) {
    setSalvando(true);
    try {
      await action(fd);
      setAberta(false);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <div
        className={classeLinha}
        role="button"
        tabIndex={0}
        onClick={() => setAberta(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setAberta(true);
        }}
      >
        {linha}
      </div>

      {montada
        ? createPortal(
            <>
              <div
                className={`sheet-overlay${aberta ? " open" : ""}`}
                onClick={() => setAberta(false)}
              />
              <div
                className={`sheet${aberta ? " open" : ""}`}
                role="dialog"
                aria-modal="true"
                aria-label={titulo}
              >
                <div className="sheet-grip" />
                <div className="sheet-title">{titulo}</div>
                <form action={enviar}>
                  {campos}
                  <button type="submit" className="cta" disabled={salvando}>
                    {salvando ? "Salvando…" : "Salvar alterações"}
                  </button>
                </form>
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  );
}
