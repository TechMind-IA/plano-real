import { desc, eq, like, lte } from "drizzle-orm";
import { db } from "@/db";
import {
  cartoes,
  comprasCartao,
  custosFixos,
  custosVariaveis,
  orcamentos,
  rendas,
} from "@/db/schema";
import { todasAsParcelas, totalPorMes } from "@/lib/faturas";

export type CotaDoDia = {
  temOrcamento: boolean;
  /* true = orçamento vem da soma das rendas ativas;
     false = fallback manual da tabela `orcamentos`. */
  usaRenda: boolean;
  orcamentoCentavos: number;
  fixosCentavos: number;
  /* Faturas de cartão que vencem no mês do dia. */
  faturasCentavos: number;
  /* Sobra do mês para variáveis a partir do dia
     (orçamento − fixos − faturas − gasto anterior). */
  sobraCentavos: number;
  diasRestantes: number;
  /* Cota do dia: sobra dividida pelos dias restantes do mês, incluindo o dia. */
  cotaCentavos: number;
  gastoDoDiaCentavos: number;
  /* O que ainda cabe no dia (negativo = estourou a cota). */
  disponivelCentavos: number;
};

function diasNoMes(dia: string): number {
  const [ano, mes] = dia.split("-").map(Number);
  return new Date(ano, mes, 0).getDate();
}

/* A cota é dinâmica por construção: o que não foi gasto até ontem volta
   para a sobra e é rateado pelos dias que faltam. Gastar menos hoje
   aumenta a cota de amanhã; estourar hoje diminui. */
export async function calcularCotaDoDia(dia: string): Promise<CotaDoDia> {
  const mes = dia.slice(0, 7);

  const [linhaOrcamento] = await db
    .select()
    .from(orcamentos)
    .where(lte(orcamentos.mes, mes))
    .orderBy(desc(orcamentos.mes))
    .limit(1);

  const [fixos, gastosDoMes, listaCartoes, compras, listaRendas] =
    await Promise.all([
      db.select().from(custosFixos).where(eq(custosFixos.ativo, true)),
      db
        .select()
        .from(custosVariaveis)
        .where(like(custosVariaveis.data, `${mes}%`)),
      db.select().from(cartoes),
      db.select().from(comprasCartao),
      db.select().from(rendas).where(eq(rendas.ativo, true)),
    ]);

  const cartoesPorId = new Map(listaCartoes.map((c) => [c.id, c]));
  const faturasCentavos =
    totalPorMes(todasAsParcelas(compras, cartoesPorId, mes)).get(mes) ?? 0;

  /* Recorrentes valem sempre; variáveis só no próprio mês. */
  const rendaCentavos = listaRendas
    .filter((r) => r.mes === null || r.mes === mes)
    .reduce((s, r) => s + r.valorCentavos, 0);
  const usaRenda = rendaCentavos > 0;
  const orcamentoCentavos = usaRenda
    ? rendaCentavos
    : (linhaOrcamento?.valorCentavos ?? 0);
  const fixosCentavos = fixos.reduce((s, c) => s + c.valorCentavos, 0);
  const gastoAnterior = gastosDoMes
    .filter((g) => g.data < dia)
    .reduce((s, g) => s + g.valorCentavos, 0);
  const gastoDoDiaCentavos = gastosDoMes
    .filter((g) => g.data === dia)
    .reduce((s, g) => s + g.valorCentavos, 0);

  const diaDoMes = Number(dia.slice(8, 10));
  const diasRestantes = Math.max(1, diasNoMes(dia) - diaDoMes + 1);
  const sobraCentavos =
    orcamentoCentavos - fixosCentavos - faturasCentavos - gastoAnterior;
  const cotaCentavos = Math.floor(sobraCentavos / diasRestantes);

  return {
    temOrcamento: usaRenda || Boolean(linhaOrcamento),
    usaRenda,
    orcamentoCentavos,
    fixosCentavos,
    faturasCentavos,
    sobraCentavos,
    diasRestantes,
    cotaCentavos,
    gastoDoDiaCentavos,
    disponivelCentavos: cotaCentavos - gastoDoDiaCentavos,
  };
}
