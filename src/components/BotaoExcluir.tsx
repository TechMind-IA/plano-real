"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import ModalConfirmacao from "./ModalConfirmacao";

/* Form mínimo em volta do ícone de lixeira — server action direta.
   stopPropagation: a linha em volta abre a folha de edição ao toque,
   e excluir não pode disparar as duas coisas. */
export default function BotaoExcluir({
  id,
  action,
  rotulo,
}: {
  id: number;
  action: (fd: FormData) => Promise<void>;
  rotulo: string;
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
        className="del-btn"
        role="button"
        tabIndex={0}
        aria-label={rotulo}
        onClick={(e) => { e.stopPropagation(); setAberto(true); }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); setAberto(true); } }}
      >
        <span className="ic-sm ic">
          <Trash2 />
        </span>
      </div>

      <ModalConfirmacao
        aberto={aberto}
        titulo="Tem certeza?"
        mensagem={`Deseja excluir ${rotulo}? Esta ação não pode ser desfeita.`}
        aoConfirmar={enviar}
        aoCancelar={() => setAberto(false)}
      />
    </>
  );
}
