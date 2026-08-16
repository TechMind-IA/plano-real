"use client";

import { useState } from "react";
import ModalConfirmacao from "./ModalConfirmacao";

export default function BotaoExcluirCartao({
  id,
  action,
}: {
  id: number;
  action: (fd: FormData) => Promise<void>;
}) {
  const [aberto, setAberto] = useState(false);

  function enviar() {
    setAberto(false);
    const fd = new FormData();
    fd.append("id", String(id));
    action(fd);
  }

  return (
    <>
      <div
        className="row"
        role="button"
        tabIndex={0}
        style={{ color: "var(--danger)", cursor: "pointer" }}
        onClick={() => setAberto(true)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setAberto(true); }}
      >
        <span className="row-label">
          Excluir cartão e todas as compras
        </span>
      </div>

      <ModalConfirmacao
        aberto={aberto}
        titulo="Tem certeza?"
        mensagem="Deseja excluir este cartão e todas as compras? Esta ação não pode ser desfeita."
        aoConfirmar={enviar}
        aoCancelar={() => setAberto(false)}
      />
    </>
  );
}
