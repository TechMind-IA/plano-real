import Link from "next/link";
import { and, desc, gte, lte } from "drizzle-orm";
import { ChevronLeft, ChevronRight, Coffee, Wallet } from "lucide-react";
import { db } from "@/db";
import { custosVariaveis } from "@/db/schema";
import { excluirCustoVariavel, salvarCustoVariavel } from "@/lib/acoes";
import { calcularCotaDoDia } from "@/lib/orcamento";
import { formatarCentavos } from "@/lib/moeda";
import {
  diaDaSemanaCurto,
  formatarDataLonga,
  hojeISO,
  inicioDaSemana,
  nomeMesDoDia,
  somarDias,
} from "@/lib/datas";
import Topbar from "@/components/Topbar";
import FolhaAdicionar from "@/components/FolhaAdicionar";
import LinhaComEdicao from "@/components/LinhaComEdicao";
import BotaoExcluir from "@/components/BotaoExcluir";
import EditarOrcamento from "@/components/EditarOrcamento";
import { CamposGasto } from "@/components/campos";

export const dynamic = "force-dynamic";

export default async function PaginaAgenda({
  searchParams,
}: {
  searchParams: Promise<{ dia?: string }>;
}) {
  const hoje = hojeISO();
  const params = await searchParams;
  const dia = /^\d{4}-\d{2}-\d{2}$/.test(params.dia ?? "")
    ? (params.dia as string)
    : hoje;

  const inicioSemana = inicioDaSemana(dia);
  const fimSemana = somarDias(inicioSemana, 6);
  const diasDaSemana = Array.from({ length: 7 }, (_, i) =>
    somarDias(inicioSemana, i),
  );

  const [gastosDaSemana, cota] = await Promise.all([
    db
      .select()
      .from(custosVariaveis)
      .where(
        and(
          gte(custosVariaveis.data, inicioSemana),
          lte(custosVariaveis.data, fimSemana),
        ),
      )
      .orderBy(desc(custosVariaveis.id)),
    calcularCotaDoDia(dia),
  ]);

  const gastosDoDia = gastosDaSemana.filter((g) => g.data === dia);
  const totalDoDia = gastosDoDia.reduce((s, g) => s + g.valorCentavos, 0);
  const contagemPorDia = new Map<string, number>();
  for (const g of gastosDaSemana) {
    contagemPorDia.set(g.data, (contagemPorDia.get(g.data) ?? 0) + 1);
  }

  const mesDoDia = dia.slice(0, 7);
  const valorAtualOrcamento =
    cota.temOrcamento && !cota.usaRenda
      ? (cota.orcamentoCentavos / 100).toFixed(2).replace(".", ",")
      : null;

  return (
    <div className="page">
      <Topbar titulo=""/>

      <div className="agenda-head">
        <Link
          className="agenda-nav"
          href={`/agenda?dia=${somarDias(dia, -7)}`}
          aria-label="Semana anterior"
        >
          <span className="ic">
            <ChevronLeft />
          </span>
        </Link>
        <span className="agenda-month">{nomeMesDoDia(dia)}</span>
        <Link
          className="agenda-nav"
          href={`/agenda?dia=${somarDias(dia, 7)}`}
          aria-label="Próxima semana"
        >
          <span className="ic">
            <ChevronRight />
          </span>
        </Link>
      </div>

      <div className="agenda-week">
        {diasDaSemana.map((d) => {
          const classes = [
            "agenda-day",
            d === hoje ? "today" : "",
            d === dia ? "selected" : "",
          ]
            .filter(Boolean)
            .join(" ");
          const n = contagemPorDia.get(d) ?? 0;
          return (
            <Link key={d} href={`/agenda?dia=${d}`} className={classes}>
              <span className="dow">{diaDaSemanaCurto(d)}</span>
              <span className="dnum">{Number(d.slice(8, 10))}</span>
              <span className="dcount">{n > 0 ? `(${n})` : ""}</span>
            </Link>
          );
        })}
      </div>

      <div className="section-label">
        <span>Saldo do dia</span>
        {cota.usaRenda ? (
          <Link href="/renda" className="link-btn">
            Editar renda
          </Link>
        ) : (
          <EditarOrcamento
            mes={mesDoDia}
            nomeMes={nomeMesDoDia(dia)}
            valorAtual={valorAtualOrcamento}
          />
        )}
      </div>

      {cota.temOrcamento ? (
        <div className="card">
          <div className="saldo-hero">
            <span className={`num${cota.disponivelCentavos < 0 ? " bad" : ""}`}>
              {formatarCentavos(cota.disponivelCentavos)}
            </span>
            <span className="lbl">
              {dia === hoje
                ? "Disponível para gastar hoje"
                : `Disponível em ${formatarDataLonga(dia).toLowerCase()}`}
            </span>
          </div>
        </div>
      ) : (
        <div className="card">
          <Link href="/renda" className="row">
            <span className="ic">
              <Wallet />
            </span>
            <span className="row-label">
              Cadastre sua renda para calcular a cota diária
            </span>
            <span className="ic chev">
              <ChevronRight />
            </span>
          </Link>
        </div>
      )}

      <div className="day-head">
        <span className="dh-date">{formatarDataLonga(dia)}</span>
        <span className="dh-count">
          {gastosDoDia.length === 0
            ? "Sem gastos"
            : `${gastosDoDia.length} ${gastosDoDia.length === 1 ? "gasto" : "gastos"} · ${formatarCentavos(totalDoDia)}`}
        </span>
      </div>

      {gastosDoDia.length === 0 ? (
        <div className="card">
          <div className="empty-line">
            <span className="ic">
              <Coffee />
            </span>
            Nenhum gasto neste dia.
          </div>
        </div>
      ) : (
        <div className="agenda-list">
          {gastosDoDia.map((g) => (
            <LinhaComEdicao
              key={g.id}
              titulo={`Editar ${g.descricao}`}
              action={salvarCustoVariavel}
              classeLinha={`agenda-item${totalDoDia > cota.cotaCentavos && cota.temOrcamento ? " estouro" : ""}`}
              linha={
                <>
                  <span className="ai-body">
                    <span className="ai-title">{g.descricao}</span>
                    <span className="ai-sub">
                      <span className="chip">{g.categoria}</span>
                    </span>
                  </span>
                  <span className="ai-valor">
                    {formatarCentavos(g.valorCentavos)}
                  </span>
                  <BotaoExcluir
                    id={g.id}
                    action={excluirCustoVariavel}
                    rotulo={`Excluir ${g.descricao}`}
                  />
                </>
              }
              campos={<CamposGasto atual={g} dataPadrao={dia} />}
            />
          ))}
        </div>
      )}

      <div className="page-end" />

      <FolhaAdicionar
        key={dia}
        titulo="Novo gasto do dia"
        rotulo="Adicionar gasto"
        action={salvarCustoVariavel}
        permitirContinuar
      >
        <CamposGasto dataPadrao={dia} />
      </FolhaAdicionar>
    </div>
  );
}
