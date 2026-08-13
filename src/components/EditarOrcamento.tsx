"use client";

import { useRef, useState } from "react";
import { salvarOrcamento } from "@/lib/acoes";

/* Botão de seção que abre a folha para definir o orçamento do mês. */
export default function EditarOrcamento({
  mes,
  nomeMes,
  valorAtual,
}: {
  mes: string;
  nomeMes: string;
  valorAtual: string | null;
}) {
  const [aberta, setAberta] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function enviar(fd: FormData) {
    setSalvando(true);
    try {
      await salvarOrcamento(fd);
      setAberta(false);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <button type="button" className="link-btn" onClick={() => setAberta(true)}>
        {valorAtual ? "Editar" : "Definir"}
      </button>

      <div
        className={`sheet-overlay${aberta ? " open" : ""}`}
        onClick={() => setAberta(false)}
      />
      <div
        className={`sheet${aberta ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Orçamento do mês"
      >
        <div className="sheet-grip" />
        <div className="sheet-title">Orçamento de {nomeMes}</div>
        <form ref={formRef} action={enviar}>
          <input type="hidden" name="mes" value={mes} />
          <div className="field">
            <label className="field-label" htmlFor="orc-valor">
              Quanto você tem para o mês
            </label>
            <input
              id="orc-valor"
              name="valor"
              className="field-input"
              inputMode="decimal"
              placeholder="0,00"
              defaultValue={valorAtual ?? ""}
              required
            />
          </div>
          <button type="submit" className="cta" disabled={salvando}>
            {salvando ? "Salvando…" : "Salvar"}
          </button>
        </form>
      </div>
    </>
  );
}
