import type { Cartao, CompraCartao } from "@/db/schema";

/* Cartão sem ciclo configurado: fechamento no fim do mês, vencimento dia 10. */
const FECHAMENTO_PADRAO = 31;
const VENCIMENTO_PADRAO = 10;

export type ParcelaFatura = {
  compraId: number;
  cartaoId: number;
  descricao: string;
  categoria: string;
  dataCompra: string;
  numero: number;
  totalParcelas: number;
  valorCentavos: number;
  /* Mês (YYYY-MM) em que a fatura desta parcela VENCE — é quando o
     dinheiro sai, então é a referência de todas as contas. */
  mesPagamento: string;
  recorrente: boolean;
};

export function somarMeses(mes: string, n: number): string {
  const [ano, m] = mes.split("-").map(Number);
  const total = ano * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

export function nomeMes(mes: string): string {
  const [ano, m] = mes.split("-").map(Number);
  return new Date(ano, m - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function diasNoMes(mes: string): number {
  const [ano, m] = mes.split("-").map(Number);
  return new Date(ano, m, 0).getDate();
}

export function cicloDoCartao(cartao: Cartao) {
  return {
    fechamento: cartao.diaFechamento ?? FECHAMENTO_PADRAO,
    vencimento: cartao.diaVencimento ?? VENCIMENTO_PADRAO,
  };
}

/* Compra até o dia do fechamento entra na fatura que fecha no próprio mês;
   depois dele, na do mês seguinte. A fatura vence no dia do vencimento —
   no mesmo mês do fechamento se o vencimento vier depois dele, senão no
   mês seguinte (ex.: fecha dia 28, vence dia 5 do mês seguinte). */
function mesPagamentoPrimeiraParcela(
  dataCompra: string,
  fechamento: number,
  vencimento: number,
): string {
  const diaCompra = Number(dataCompra.slice(8, 10));
  const mesCompra = dataCompra.slice(0, 7);
  const fechamentoEfetivo = Math.min(fechamento, diasNoMes(mesCompra));
  const mesFechamento =
    diaCompra <= fechamentoEfetivo ? mesCompra : somarMeses(mesCompra, 1);
  return vencimento > fechamento ? mesFechamento : somarMeses(mesFechamento, 1);
}

/* Divisão como o cartão faz: parcelas iguais, com a sobra do arredondamento
   na primeira. Soma das parcelas == valor total, sempre.
   Assinatura (recorrente): valor cheio em todo mês de primeiroMes até
   `ateMes` (horizonte de quem consulta), respeitando fimMes se cancelada. */
export function parcelasDaCompra(
  compra: CompraCartao,
  cartao: Cartao,
  ateMes?: string,
): ParcelaFatura[] {
  const { fechamento, vencimento } = cicloDoCartao(cartao);
  const primeiroMes = mesPagamentoPrimeiraParcela(
    compra.data,
    fechamento,
    vencimento,
  );

  const comum = {
    compraId: compra.id,
    cartaoId: compra.cartaoId,
    descricao: compra.descricao,
    categoria: compra.categoria,
    dataCompra: compra.data,
  };

  if (compra.recorrente) {
    const horizonte = ateMes ?? primeiroMes;
    const fim =
      compra.fimMes && compra.fimMes < horizonte ? compra.fimMes : horizonte;
    const ocorrencias: ParcelaFatura[] = [];
    for (let m = primeiroMes, i = 1; m <= fim; m = somarMeses(m, 1), i++) {
      ocorrencias.push({
        ...comum,
        numero: i,
        totalParcelas: 1,
        valorCentavos: compra.valorTotalCentavos,
        mesPagamento: m,
        recorrente: true,
      });
    }
    return ocorrencias;
  }

  const base = Math.floor(compra.valorTotalCentavos / compra.parcelas);
  const primeira = compra.valorTotalCentavos - base * (compra.parcelas - 1);

  return Array.from({ length: compra.parcelas }, (_, i) => ({
    ...comum,
    numero: i + 1,
    totalParcelas: compra.parcelas,
    valorCentavos: i === 0 ? primeira : base,
    mesPagamento: somarMeses(primeiroMes, i),
    recorrente: false,
  }));
}

export function todasAsParcelas(
  compras: CompraCartao[],
  cartoesPorId: Map<number, Cartao>,
  ateMes?: string,
): ParcelaFatura[] {
  return compras.flatMap((c) => {
    const cartao = cartoesPorId.get(c.cartaoId);
    return cartao ? parcelasDaCompra(c, cartao, ateMes) : [];
  });
}

export function totalPorMes(parcelas: ParcelaFatura[]): Map<string, number> {
  const totais = new Map<string, number>();
  for (const p of parcelas) {
    totais.set(p.mesPagamento, (totais.get(p.mesPagamento) ?? 0) + p.valorCentavos);
  }
  return totais;
}
