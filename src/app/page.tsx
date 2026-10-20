import Link from "next/link";
import { and, eq, like } from "drizzle-orm";
import {
  CalendarCheck,
  CalendarDays,
  ChevronRight,
  CreditCard,
  HandCoins,
  BarChart3,
  ShoppingCart,
  Ticket,
} from "lucide-react";
import { db } from "@/db";
import { cartoes, custosFixos, custosVariaveis, rendas } from "@/db/schema";
import { formatarCentavos } from "@/lib/moeda";
import { hojeISO, mesAtualISO, nomeMesAtual } from "@/lib/datas";
import { calcularCotaDoDia } from "@/lib/orcamento";
import { exigirUsuario } from "@/lib/sessao";
import FolhaAdicionar from "@/components/FolhaAdicionar";
import BotaoSair from "@/components/BotaoSair";
import { CamposGasto } from "@/components/campos";
import { salvarCustoVariavel } from "@/lib/acoes";

export const dynamic = "force-dynamic";

export default async function Home() {
  const usuario = await exigirUsuario();
  const primeiroNome = usuario.name.split(" ")[0] ?? usuario.name;
  const iniciais = usuario.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");

  const [fixos, variaveisDoMes, listaCartoes, listaRendas, cotaHoje] =
    await Promise.all([
      db
        .select()
        .from(custosFixos)
        .where(
          and(eq(custosFixos.usuarioId, usuario.id), eq(custosFixos.ativo, true)),
        ),
      db
        .select()
        .from(custosVariaveis)
        .where(
          and(
            eq(custosVariaveis.usuarioId, usuario.id),
            like(custosVariaveis.data, `${mesAtualISO()}%`),
          ),
        ),
      db.select().from(cartoes).where(eq(cartoes.usuarioId, usuario.id)),
      db
        .select()
        .from(rendas)
        .where(and(eq(rendas.usuarioId, usuario.id), eq(rendas.ativo, true))),
      calcularCotaDoDia(hojeISO(), usuario.id),
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
          <h1>Olá, {primeiroNome}</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="avatar" aria-hidden>
            {iniciais || "F"}
          </span>
          <BotaoSair />
        </div>
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
        {usuario.role === "admin" ? (
          <Link href="/convites" className="row">
            <span className="ic">
              <Ticket />
            </span>
            <span className="row-label">Convites</span>
            <span className="ic chev">
              <ChevronRight />
            </span>
          </Link>
        ) : null}
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
