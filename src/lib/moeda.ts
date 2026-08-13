const formatador = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatarCentavos(centavos: number): string {
  return formatador.format(centavos / 100);
}

/* Centavos → valor editável em campo de formulário ("1234,56"). */
export function centavosParaEntrada(centavos: number): string {
  return (centavos / 100).toFixed(2).replace(".", ",");
}

/* Aceita "1.234,56", "1234,56", "1234.56", "R$ 1.234,56" e "1234". */
export function paraCentavos(entrada: string): number | null {
  const limpo = entrada.replace(/[R$\s]/g, "");
  if (!limpo) return null;
  let normalizado: string;
  if (limpo.includes(",")) {
    normalizado = limpo.replace(/\./g, "").replace(",", ".");
  } else {
    normalizado = limpo;
  }
  const valor = Number(normalizado);
  if (!Number.isFinite(valor) || valor < 0) return null;
  return Math.round(valor * 100);
}
