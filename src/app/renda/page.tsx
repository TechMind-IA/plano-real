import { asc, desc } from "drizzle-orm";
import { Coffee, HandCoins, Sparkles } from "lucide-react";
import { db } from "@/db";
import { rendas, type Renda } from "@/db/schema";
import { excluirRenda, salvarRenda } from "@/lib/acoes";
import { formatarCentavos } from "@/lib/moeda";
import { mesAtualISO, nomeMesAtual } from "@/lib/datas";
import { nomeMes } from "@/lib/faturas";
import Topbar from "@/components/Topbar";
import FolhaAdicionar from "@/components/FolhaAdicionar";
import LinhaComEdicao from "@/components/LinhaComEdicao";
import BotaoExcluir from "@/components/BotaoExcluir";
import { CamposRenda } from "@/components/campos";

export const dynamic = "force-dynamic";

function LinhaRenda({
  renda,
  sub,
  variavel,
}: {
  renda: Renda;
  sub: string;
  variavel?: boolean;
}) {
  return (
    <LinhaComEdicao
      titulo={`Editar ${renda.nome}`}
      action={salvarRenda}
      linha={
        <>
          <span className="ic">{variavel ? <Sparkles /> : <HandCoins />}</span>
          <span className="row-label">
            {renda.nome}
            <span className="row-sub-label">{sub}</span>
          </span>
          <span className="row-valor">
            {formatarCentavos(renda.valorCentavos)}
          </span>
          <BotaoExcluir
            id={renda.id}
            action={excluirRenda}
            rotulo={`Excluir ${renda.nome}`}
          />
        </>
      }
      campos={<CamposRenda atual={renda} mesPadrao={mesAtualISO()} />}
    />
  );
}

export default async function PaginaRenda() {
  const lista = await db
    .select()
    .from(rendas)
    .orderBy(desc(rendas.mes), asc(rendas.diaRecebimento), asc(rendas.nome));

  const mesAtual = mesAtualISO();
  const recorrentes = lista.filter((r) => r.mes === null);
  const variaveis = lista.filter((r) => r.mes !== null);
  const totalMesAtual = lista
    .filter((r) => r.ativo && (r.mes === null || r.mes === mesAtual))
    .reduce((s, r) => s + r.valorCentavos, 0);

  return (
    <div className="page">
      <Topbar
        titulo="Renda"
        subtitulo={`${formatarCentavos(totalMesAtual)} em ${nomeMesAtual()}`}
      />

      <div className="section-label">
        <span>Fontes recorrentes · todo mês</span>
      </div>
      <div className="card">
        {recorrentes.length === 0 ? (
          <div className="empty-line">
            <span className="ic">
              <Coffee />
            </span>
            Nenhuma renda recorrente cadastrada.
          </div>
        ) : (
          recorrentes.map((r) => (
            <LinhaRenda
              key={r.id}
              renda={r}
              sub={
                r.categoria +
                (r.diaRecebimento ? ` · Recebe dia ${r.diaRecebimento}` : "")
              }
            />
          ))
        )}
      </div>

      <div className="section-label">
        <span>Rendas variáveis · por mês</span>
      </div>
      <div className="card">
        {variaveis.length === 0 ? (
          <div className="empty-line">
            <span className="ic">
              <Coffee />
            </span>
            Nenhuma renda variável lançada.
          </div>
        ) : (
          variaveis.map((r) => (
            <LinhaRenda
              key={r.id}
              renda={r}
              variavel
              sub={`${r.categoria} · ${nomeMes(r.mes as string)}`}
            />
          ))
        )}
      </div>

      <div className="page-end" />

      <FolhaAdicionar
        titulo="Nova fonte de renda"
        rotulo="Adicionar renda"
        action={salvarRenda}
      >
        <CamposRenda mesPadrao={mesAtual} />
      </FolhaAdicionar>
    </div>
  );
}
