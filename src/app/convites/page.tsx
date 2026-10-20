import { desc, eq } from "drizzle-orm";
import { Ticket } from "lucide-react";
import { db } from "@/db";
import { convites } from "@/db/schema";
import { exigirAdmin } from "@/lib/sessao";
import { hojeISO } from "@/lib/datas";
import Topbar from "@/components/Topbar";
import FormConvite from "./FormConvite";

export const dynamic = "force-dynamic";

function situacao(convite: {
  usadoPor: string | null;
  validoAte: string | null;
}) {
  if (convite.usadoPor) return { texto: "Usado", classe: "pill" };
  if (convite.validoAte && convite.validoAte < hojeISO())
    return { texto: "Expirado", classe: "pill bad" };
  return { texto: "Ativo", classe: "pill ok" };
}

export default async function PaginaConvites() {
  const usuario = await exigirAdmin();

  const lista = await db
    .select()
    .from(convites)
    .where(eq(convites.criadoPor, usuario.id))
    .orderBy(desc(convites.id));

  const ativos = lista.filter(
    (c) => !c.usadoPor && (!c.validoAte || c.validoAte >= hojeISO()),
  ).length;

  return (
    <div className="page">
      <Topbar
        titulo="Convites"
        subtitulo={`${ativos} ${ativos === 1 ? "ativo" : "ativos"} · ${lista.length} no total`}
      />

      <FormConvite />

      <div className="section-label">
        <span>Convites gerados</span>
      </div>
      <div className="card">
        {lista.length === 0 ? (
          <div className="empty-line">
            <span className="ic">
              <Ticket />
            </span>
            Nenhum convite criado ainda.
          </div>
        ) : (
          lista.map((convite) => {
            const situacaoAtual = situacao(convite);
            return (
              <div key={convite.id} className="row row-static">
                <span className="ic">
                  <Ticket />
                </span>
                <span className="row-label">
                  {convite.codigo}
                  <span className="row-sub-label">
                    {convite.email ? `${convite.email} · ` : ""}
                    {convite.validoAte
                      ? `válido até ${convite.validoAte.slice(8, 10)}/${convite.validoAte.slice(5, 7)}`
                      : "sem prazo"}
                  </span>
                </span>
                <span className={situacaoAtual.classe}>{situacaoAtual.texto}</span>
              </div>
            );
          })
        )}
      </div>

      <div className="page-end" />
    </div>
  );
}
