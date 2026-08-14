"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";

/* Padrão Mission: CTA fixo no rodapé abre uma bottom sheet com o
   formulário. A action chega pronta do server component.
   Com `permitirContinuar`, ganha um segundo botão que salva e mantém
   a folha aberta para o próximo lançamento. */
export default function FolhaAdicionar({
  titulo,
  rotulo,
  action,
  permitirContinuar = false,
  fab = false,
  children,
}: {
  titulo: string;
  rotulo: string;
  action: (fd: FormData) => Promise<void>;
  permitirContinuar?: boolean;
  fab?: boolean;
  children: React.ReactNode;
}) {
  const [aberta, setAberta] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function enviar(fd: FormData) {
    /* O botão de submit clicado entra no FormData: name="continuar". */
    const continuar = fd.get("continuar") === "1";
    setSalvando(true);
    try {
      await action(fd);
      formRef.current?.reset();
      if (continuar) {
        formRef.current
          ?.querySelector<HTMLInputElement>("input:not([type=hidden])")
          ?.focus();
      } else {
        setAberta(false);
      }
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      {fab ? (
        <button
          type="button"
          className="fab"
          onClick={() => setAberta(true)}
          aria-label={rotulo}
        >
          <Plus />
        </button>
      ) : (
        <div className="cta-bar">
          <button type="button" className="cta" onClick={() => setAberta(true)}>
            <span className="ic">
              <Plus />
            </span>
            {rotulo}
          </button>
        </div>
      )}

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
        <form ref={formRef} action={enviar}>
          {children}
          {permitirContinuar ? (
            <div className="cta-row">
              <button
                type="submit"
                name="continuar"
                value="1"
                className="cta-secondary"
                disabled={salvando}
              >
                Salvar e lançar outro
              </button>
              <button type="submit" className="cta" disabled={salvando}>
                {salvando ? "Salvando…" : "Salvar"}
              </button>
            </div>
          ) : (
            <button type="submit" className="cta" disabled={salvando}>
              {salvando ? "Salvando…" : "Salvar"}
            </button>
          )}
        </form>
      </div>
    </>
  );
}
