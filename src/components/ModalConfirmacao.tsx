"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

export default function ModalConfirmacao({
  aberto,
  titulo,
  mensagem,
  aoConfirmar,
  aoCancelar,
}: {
  aberto: boolean;
  titulo: string;
  mensagem: string;
  aoConfirmar: () => void;
  aoCancelar: () => void;
}) {
  const montada = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!montada) return null;

  return createPortal(
    <>
      <div
        className={`sheet-overlay${aberto ? " open" : ""}`}
        onClick={(e) => { e.stopPropagation(); aoCancelar(); }}
      />
      <div
        className={`confirm-dialog${aberto ? " open" : ""}`}
        role="alertdialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-dialog-title">{titulo}</div>
        <p className="confirm-dialog-msg">{mensagem}</p>
        <div className="cta-row">
          <button type="button" className="cta cta-secondary" onClick={(e) => { e.stopPropagation(); aoCancelar(); }}>
            Cancelar
          </button>
          <button type="button" className="cta cta-danger" onClick={(e) => { e.stopPropagation(); aoConfirmar(); }}>
            Confirmar exclusão
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}
