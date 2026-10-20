"use client";

import { useActionState, useState } from "react";
import { Check, Copy } from "lucide-react";
import { criarConvite } from "@/lib/acoes";

/* Gera um convite e mostra o link pronto para compartilhar
   (WhatsApp/e-mail manual — o app não envia e-mails). */
export default function FormConvite() {
  const [estado, acao, pendente] = useActionState(criarConvite, {});
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    if (!estado.link) return;
    try {
      await navigator.clipboard.writeText(estado.link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* clipboard indisponível — o link está visível para copiar à mão */
    }
  }

  return (
    <form action={acao}>
      <div className="card auth-card">
        <label className="field">
          <span className="field-label">
            E-mail de quem será convidado (opcional)
          </span>
          <input
            className="field-input"
            type="email"
            name="email"
            inputMode="email"
            placeholder="pessoa@email.com"
          />
        </label>
      </div>

      <div className="auth-cta">
        <button type="submit" className="cta" disabled={pendente}>
          {pendente ? "Gerando..." : "Gerar convite"}
        </button>
      </div>

      {estado.link ? (
        <div className="card" style={{ marginTop: 16, padding: "14px 16px" }}>
          <div className="field-label" style={{ paddingBottom: 6 }}>
            Link do convite
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <code
              style={{
                flex: "1 1 200px",
                fontSize: 13,
                fontWeight: 700,
                wordBreak: "break-all",
                color: "var(--deep)",
              }}
            >
              {estado.link}
            </code>
            <button
              type="button"
              className="btn btn-outline"
              style={{ flex: "none" }}
              onClick={copiar}
            >
              {copiado ? <Check size={16} /> : <Copy size={16} />}
              {copiado ? "Copiado" : "Copiar"}
            </button>
          </div>
        </div>
      ) : null}
    </form>
  );
}
