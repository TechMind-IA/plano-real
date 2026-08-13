"use client";

import { Trash2 } from "lucide-react";

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
  return (
    <form action={action} onClick={(e) => e.stopPropagation()}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="del-btn" aria-label={rotulo}>
        <span className="ic-sm ic">
          <Trash2 />
        </span>
      </button>
    </form>
  );
}
