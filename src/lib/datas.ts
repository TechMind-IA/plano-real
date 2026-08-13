/* Datas em hora local do servidor — toISOString() usaria UTC e viraria
   o dia mais cedo no fuso do Brasil. */

export function hojeISO(): string {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${agora.getFullYear()}-${mes}-${dia}`;
}

export function mesAtualISO(): string {
  return hojeISO().slice(0, 7);
}

export function nomeMesAtual(): string {
  return new Date().toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

export function formatarDataCurta(iso: string): string {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}

/* Constrói a Date em hora local (new Date("YYYY-MM-DD") interpretaria UTC). */
export function isoParaData(iso: string): Date {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

export function dataParaISO(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mes}-${dia}`;
}

export function somarDias(iso: string, dias: number): string {
  const data = isoParaData(iso);
  data.setDate(data.getDate() + dias);
  return dataParaISO(data);
}

/* Segunda-feira da semana que contém o dia. */
export function inicioDaSemana(iso: string): string {
  const data = isoParaData(iso);
  const desvio = (data.getDay() + 6) % 7;
  return somarDias(iso, -desvio);
}

export function nomeMesDoDia(iso: string): string {
  return isoParaData(iso).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

export function diaDaSemanaCurto(iso: string): string {
  return isoParaData(iso)
    .toLocaleDateString("pt-BR", { weekday: "short" })
    .replace(".", "");
}

export function formatarDataLonga(iso: string): string {
  const texto = isoParaData(iso).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
