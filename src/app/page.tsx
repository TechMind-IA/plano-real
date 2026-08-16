import Link from "next/link";
import { eq, like } from "drizzle-orm";
import {
  CalendarCheck,
  CalendarDays,
  ChevronRight,
  CreditCard,
  HandCoins,
  BarChart3,
  ShoppingCart,
} from "lucide-react";
import { db } from "@/db";
import { cartoes, custosFixos, custosVariaveis, rendas } from "@/db/schema";
import { formatarCentavos } from "@/lib/moeda";
import { hojeISO, mesAtualISO, nomeMesAtual } from "@/lib/datas";
import { calcularCotaDoDia } from "@/lib/orcamento";
import FolhaAdicionar from "@/components/FolhaAdicionar";
import { CamposGasto } from "@/components/campos";
import { salvarCustoVariavel } from "@/lib/acoes";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [fixos, variaveisDoMes, listaCartoes, listaRendas, cotaHoje] =
    await Promise.all([
      db.select().from(custosFixos).where(eq(custosFixos.ativo, true)),
      db
        .select()
        .from(custosVariaveis)
        .where(like(custosVariaveis.data, `${mesAtualISO()}%`)),
      db.select().from(cartoes),
      db.select().from(rendas).where(eq(rendas.ativo, true)),
      calcularCotaDoDia(hojeISO()),
    ]);

  const rendasDoMes = listaRendas.filter(
    (r) => r.mes === null || r.mes === mesAtualISO(),
  );
  const rendaTotalMes = rendasDoMes.reduce((s, r) => s + r.valorCentavos, 0);
  const totalFixos = fixos.reduce((s, c) => s + c.valorCentavos, 0);
  const totalVariaveis = variaveisDoMes.reduce((s, c) => s + c.valorCentavos, 0);
  const totalMes = totalFixos + totalVariaveis + cotaHoje.faturasCentavos;

  return (
    <div className="page">
      <div className="greeting">
        <div className="greeting-text">
          <h1>Olá, Diego</h1>
        </div>
        <span className="avatar">DM</span>
      </div>

      <div className="section-label">
        <span>Visão geral - {nomeMesAtual()}</span>
      </div>
      <div className="card">
        <div className="overview-grid">
          <div className="overview-cell overview-cell-full">
            <span className="num hot">{formatarCentavos(rendaTotalMes)}</span>
            <span className="lbl">Renda total</span>
          </div>
          <div className="overview-cell">
            <span className="num">{formatarCentavos(totalFixos)}</span>
            <span className="lbl">Gastos fixos</span>
          </div>
          <div className="overview-cell">
            <span className="num">{formatarCentavos(totalVariaveis)}</span>
            <span className="lbl">Gastos variáveis</span>
          </div>
          <div className="overview-cell">
            <span className="num">{formatarCentavos(cotaHoje.faturasCentavos)}</span>
            <span className="lbl">Faturas de cartão</span>
          </div>
          <div className="overview-cell">
            <span className="num hot">{formatarCentavos(totalMes)}</span>
            <span className="lbl">Gastos totais</span>
          </div>
        </div>
      </div>

      <div className="section-label">
        <span>Dia a dia</span>
      </div>
      <div className="modules">
        <Link href="/agenda" className="module-card featured">
          <span className="module-icon">
            <span className="ic">
              <CalendarDays />
            </span>
          </span>
          <span className="module-text">
            <strong>Agenda de gastos</strong>
            <small>
              {cotaHoje.temOrcamento
                ? `${formatarCentavos(cotaHoje.disponivelCentavos)} disponíveis para hoje`
                : "Cadastre sua renda do mês"}
            </small>
          </span>
          <span className="ic chev">
            <ChevronRight />
          </span>
        </Link>
        <Link href="/relatorios" className="module-card module-compact">
          <span className="module-icon">
            <span className="ic">
              <BarChart3 />
            </span>
          </span>
          <span className="module-text">
            <strong>Relatórios</strong>
            <small>Gastos por categoria</small>
          </span>
          <span className="ic chev">
            <ChevronRight />
          </span>
        </Link>
      </div>

      <div className="section-label">
        <span>Cadastros</span>
      </div>
      <div className="card">
        <Link href="/renda" className="row">
          <span className="ic">
            <HandCoins />
          </span>
          <span className="row-label">Renda</span>
          <span className="badge">{rendasDoMes.length}</span>
          <span className="ic chev">
            <ChevronRight />
          </span>
        </Link>
        <Link href="/fixos" className="row">
          <span className="ic">
            <CalendarCheck />
          </span>
          <span className="row-label">Custos fixos</span>
          <span className="badge">{fixos.length}</span>
          <span className="ic chev">
            <ChevronRight />
          </span>
        </Link>
        <Link href="/variaveis" className="row">
          <span className="ic">
            <ShoppingCart />
          </span>
          <span className="row-label">Custos variáveis</span>
          <span className="badge">{variaveisDoMes.length}</span>
          <span className="ic chev">
            <ChevronRight />
          </span>
        </Link>
        <Link href="/cartoes" className="row">
          <span className="ic">
            <CreditCard />
          </span>
          <span className="row-label">Cartões de crédito</span>
          <span className="badge">{listaCartoes.length}</span>
          <span className="ic chev">
            <ChevronRight />
          </span>
        </Link>
      </div>

      <FolhaAdicionar
        titulo="Novo gasto do dia"
        rotulo="Adicionar gasto"
        action={salvarCustoVariavel}
        permitirContinuar
        fab
      >
        <CamposGasto dataPadrao={hojeISO()} />
      </FolhaAdicionar>

      <div className="page-end" />
    </div>
  );
}
