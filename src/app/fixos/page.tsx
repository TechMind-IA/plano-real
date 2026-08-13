import { asc } from "drizzle-orm";
import { CalendarCheck, Coffee } from "lucide-react";
import { db } from "@/db";
import { custosFixos } from "@/db/schema";
import { excluirCustoFixo, salvarCustoFixo } from "@/lib/acoes";
import { formatarCentavos } from "@/lib/moeda";
import Topbar from "@/components/Topbar";
import FolhaAdicionar from "@/components/FolhaAdicionar";
import LinhaComEdicao from "@/components/LinhaComEdicao";
import BotaoExcluir from "@/components/BotaoExcluir";
import { CamposCustoFixo } from "@/components/campos";

export const dynamic = "force-dynamic";

export default async function PaginaFixos() {
  const lista = await db
    .select()
    .from(custosFixos)
    .orderBy(asc(custosFixos.diaVencimento), asc(custosFixos.nome));

  const total = lista
    .filter((c) => c.ativo)
    .reduce((s, c) => s + c.valorCentavos, 0);

  return (
    <div className="page">
      <Topbar
        titulo="Custos fixos"
        subtitulo={`${formatarCentavos(total)} por mês`}
      />

      <div className="section-label">
        <span>Compromissos mensais</span>
      </div>
      <div className="card">
        {lista.length === 0 ? (
          <div className="empty-line">
            <span className="ic">
              <Coffee />
            </span>
            Nenhum custo fixo cadastrado.
          </div>
        ) : (
          lista.map((c) => (
            <LinhaComEdicao
              key={c.id}
              titulo={`Editar ${c.nome}`}
              action={salvarCustoFixo}
              linha={
                <>
                  <span className="ic">
                    <CalendarCheck />
                  </span>
                  <span className="row-label">
                    {c.nome}
                    <span className="row-sub-label">
                      {c.categoria}
                      {c.diaVencimento ? ` · Vence dia ${c.diaVencimento}` : ""}
                    </span>
                  </span>
                  <span className="row-valor">
                    {formatarCentavos(c.valorCentavos)}
                  </span>
                  <BotaoExcluir
                    id={c.id}
                    action={excluirCustoFixo}
                    rotulo={`Excluir ${c.nome}`}
                  />
                </>
              }
              campos={<CamposCustoFixo atual={c} />}
            />
          ))
        )}
      </div>

      <div className="page-end" />

      <FolhaAdicionar
        titulo="Novo custo fixo"
        rotulo="Adicionar custo fixo"
        action={salvarCustoFixo}
      >
        <CamposCustoFixo />
      </FolhaAdicionar>
    </div>
  );
}
