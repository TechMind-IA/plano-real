"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  cartoes,
  comprasCartao,
  custosFixos,
  custosVariaveis,
  orcamentos,
  rendas,
} from "@/db/schema";
import { paraCentavos } from "@/lib/moeda";

/* As ações salvar* criam quando não há `id` no form e atualizam quando há —
   o mesmo formulário serve para as duas coisas. */

function lerTexto(fd: FormData, campo: string): string {
  return String(fd.get(campo) ?? "").trim();
}

function lerDia(fd: FormData, campo: string): number | null {
  const dia = Number(lerTexto(fd, campo));
  return Number.isInteger(dia) && dia >= 1 && dia <= 31 ? dia : null;
}

function lerId(fd: FormData, campo = "id"): number | null {
  const id = Number(fd.get(campo));
  return Number.isInteger(id) && id > 0 ? id : null;
}

/* ── Renda ── */

export async function salvarRenda(fd: FormData) {
  const id = lerId(fd);
  const nome = lerTexto(fd, "nome");
  const valor = paraCentavos(lerTexto(fd, "valor"));
  if (!nome || valor === null) return;

  const avulsa = fd.get("avulsa") === "on";
  const mesRef = lerTexto(fd, "mes");
  const valores = {
    nome,
    valorCentavos: valor,
    categoria: lerTexto(fd, "categoria") || "Outros",
    diaRecebimento: lerDia(fd, "diaRecebimento"),
    /* null = recorrente (todo mês); YYYY-MM = renda variável do mês. */
    mes: avulsa && /^\d{4}-\d{2}$/.test(mesRef) ? mesRef : null,
  };
  if (id) await db.update(rendas).set(valores).where(eq(rendas.id, id));
  else await db.insert(rendas).values(valores);
  revalidatePath("/");
  revalidatePath("/agenda");
  revalidatePath("/renda");
}

export async function excluirRenda(fd: FormData) {
  const id = lerId(fd);
  if (!id) return;
  await db.delete(rendas).where(eq(rendas.id, id));
  revalidatePath("/");
  revalidatePath("/agenda");
  revalidatePath("/renda");
}

/* ── Custos fixos ── */

export async function salvarCustoFixo(fd: FormData) {
  const id = lerId(fd);
  const nome = lerTexto(fd, "nome");
  const valor = paraCentavos(lerTexto(fd, "valor"));
  if (!nome || valor === null) return;

  const valores = {
    nome,
    valorCentavos: valor,
    categoria: lerTexto(fd, "categoria") || "Outros",
    diaVencimento: lerDia(fd, "diaVencimento"),
  };
  if (id) await db.update(custosFixos).set(valores).where(eq(custosFixos.id, id));
  else await db.insert(custosFixos).values(valores);
  revalidatePath("/");
  revalidatePath("/fixos");
  revalidatePath("/agenda");
}

export async function excluirCustoFixo(fd: FormData) {
  const id = lerId(fd);
  if (!id) return;
  await db.delete(custosFixos).where(eq(custosFixos.id, id));
  revalidatePath("/");
  revalidatePath("/fixos");
  revalidatePath("/agenda");
}

/* ── Custos variáveis (gastos do dia) ── */

export async function salvarCustoVariavel(fd: FormData) {
  const id = lerId(fd);
  const descricao = lerTexto(fd, "descricao");
  const valor = paraCentavos(lerTexto(fd, "valor"));
  const data = lerTexto(fd, "data");
  if (!descricao || valor === null || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return;

  const valores = {
    descricao,
    valorCentavos: valor,
    data,
    categoria: lerTexto(fd, "categoria") || "Outros",
  };
  if (id) {
    await db.update(custosVariaveis).set(valores).where(eq(custosVariaveis.id, id));
  } else {
    await db.insert(custosVariaveis).values(valores);
  }
  revalidatePath("/");
  revalidatePath("/variaveis");
  revalidatePath("/agenda");
}

export async function excluirCustoVariavel(fd: FormData) {
  const id = lerId(fd);
  if (!id) return;
  await db.delete(custosVariaveis).where(eq(custosVariaveis.id, id));
  revalidatePath("/");
  revalidatePath("/variaveis");
  revalidatePath("/agenda");
}

/* ── Cartões ── */

export async function salvarCartao(fd: FormData) {
  const id = lerId(fd);
  const nome = lerTexto(fd, "nome");
  if (!nome) return;

  const valores = {
    nome,
    bandeira: lerTexto(fd, "bandeira") || null,
    limiteCentavos: paraCentavos(lerTexto(fd, "limite")),
    diaFechamento: lerDia(fd, "diaFechamento"),
    diaVencimento: lerDia(fd, "diaVencimento"),
  };
  if (id) await db.update(cartoes).set(valores).where(eq(cartoes.id, id));
  else await db.insert(cartoes).values(valores);
  revalidatePath("/");
  revalidatePath("/agenda");
  revalidatePath("/cartoes", "layout");
}

export async function excluirCartao(fd: FormData) {
  const id = lerId(fd);
  if (!id) return;
  await db.delete(cartoes).where(eq(cartoes.id, id));
  revalidatePath("/");
  revalidatePath("/agenda");
  revalidatePath("/cartoes", "layout");
}

/* ── Compras no cartão ── */

export async function salvarCompraCartao(fd: FormData) {
  const id = lerId(fd);
  const cartaoId = lerId(fd, "cartaoId");
  const descricao = lerTexto(fd, "descricao");
  const valor = paraCentavos(lerTexto(fd, "valor"));
  const data = lerTexto(fd, "data");
  const parcelas = Number(lerTexto(fd, "parcelas") || "1");
  if (
    !cartaoId ||
    !descricao ||
    valor === null ||
    !/^\d{4}-\d{2}-\d{2}$/.test(data) ||
    !Number.isInteger(parcelas) ||
    parcelas < 1 ||
    parcelas > 48
  ) {
    return;
  }

  const recorrente = fd.get("recorrente") === "on";
  const fimMes = lerTexto(fd, "fimMes");
  const valores = {
    cartaoId,
    descricao,
    valorTotalCentavos: valor,
    /* Assinatura não parcela: repete o valor cheio a cada fatura. */
    parcelas: recorrente ? 1 : parcelas,
    data,
    categoria: lerTexto(fd, "categoria") || "Outros",
    recorrente,
    fimMes: recorrente && /^\d{4}-\d{2}$/.test(fimMes) ? fimMes : null,
  };
  if (id) {
    await db.update(comprasCartao).set(valores).where(eq(comprasCartao.id, id));
  } else {
    await db.insert(comprasCartao).values(valores);
  }
  revalidatePath("/");
  revalidatePath("/agenda");
  revalidatePath("/cartoes", "layout");
}

export async function excluirCompraCartao(fd: FormData) {
  const id = lerId(fd);
  if (!id) return;
  await db.delete(comprasCartao).where(eq(comprasCartao.id, id));
  revalidatePath("/");
  revalidatePath("/agenda");
  revalidatePath("/cartoes", "layout");
}

/* ── Orçamento do mês (fallback manual quando não há renda) ── */

export async function salvarOrcamento(fd: FormData) {
  const mes = lerTexto(fd, "mes");
  const valor = paraCentavos(lerTexto(fd, "valor"));
  if (!/^\d{4}-\d{2}$/.test(mes) || valor === null) return;

  await db
    .insert(orcamentos)
    .values({ mes, valorCentavos: valor })
    .onConflictDoUpdate({
      target: orcamentos.mes,
      set: { valorCentavos: valor },
    });
  revalidatePath("/");
  revalidatePath("/agenda");
}
