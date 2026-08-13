import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/* Valores monetários são sempre inteiros em centavos — nunca float. */

export const cartoes = sqliteTable("cartoes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nome: text("nome").notNull(),
  bandeira: text("bandeira"),
  limiteCentavos: integer("limite_centavos"),
  diaFechamento: integer("dia_fechamento"),
  diaVencimento: integer("dia_vencimento"),
  criadoEm: text("criado_em")
    .notNull()
    .default(sql`(datetime('now'))`),
});

/* Renda: recorrente (salário, vale refeição — `mes` null, vale todo mês)
   ou variável (hora extra, freela — `mes` YYYY-MM, vale só naquele mês).
   A soma das ativas do mês é o orçamento; a tabela `orcamentos` fica como
   fallback manual para quem não cadastrou renda. */
export const rendas = sqliteTable("rendas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nome: text("nome").notNull(),
  categoria: text("categoria").notNull().default("Outros"),
  valorCentavos: integer("valor_centavos").notNull(),
  diaRecebimento: integer("dia_recebimento"),
  mes: text("mes"),
  ativo: integer("ativo", { mode: "boolean" }).notNull().default(true),
  criadoEm: text("criado_em")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const custosFixos = sqliteTable("custos_fixos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nome: text("nome").notNull(),
  categoria: text("categoria").notNull().default("Outros"),
  valorCentavos: integer("valor_centavos").notNull(),
  diaVencimento: integer("dia_vencimento"),
  ativo: integer("ativo", { mode: "boolean" }).notNull().default(true),
  criadoEm: text("criado_em")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const custosVariaveis = sqliteTable("custos_variaveis", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  descricao: text("descricao").notNull(),
  categoria: text("categoria").notNull().default("Outros"),
  valorCentavos: integer("valor_centavos").notNull(),
  /* Data da despesa em ISO (YYYY-MM-DD) — filtros por mês via LIKE 'YYYY-MM%'. */
  data: text("data").notNull(),
  cartaoId: integer("cartao_id").references(() => cartoes.id, {
    onDelete: "set null",
  }),
  criadoEm: text("criado_em")
    .notNull()
    .default(sql`(datetime('now'))`),
});

/* Compra no cartão. As parcelas não viram linhas: são derivadas do total,
   do nº de parcelas e do ciclo de fechamento do cartão (src/lib/faturas.ts),
   então não há risco de dessincronizar. */
export const comprasCartao = sqliteTable("compras_cartao", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cartaoId: integer("cartao_id")
    .notNull()
    .references(() => cartoes.id, { onDelete: "cascade" }),
  descricao: text("descricao").notNull(),
  categoria: text("categoria").notNull().default("Outros"),
  valorTotalCentavos: integer("valor_total_centavos").notNull(),
  parcelas: integer("parcelas").notNull().default(1),
  /* Data da compra (YYYY-MM-DD) — define a primeira fatura. */
  data: text("data").notNull(),
  /* Assinatura: repete o valor cheio em toda fatura a partir da primeira,
     até fimMes (inclusive) quando cancelada — histórico preservado. */
  recorrente: integer("recorrente", { mode: "boolean" }).notNull().default(false),
  fimMes: text("fim_mes"),
  criadoEm: text("criado_em")
    .notNull()
    .default(sql`(datetime('now'))`),
});

/* Orçamento disponível por mês (YYYY-MM). Sem linha para o mês corrente,
   vale a linha mais recente anterior (carry-forward). */
export const orcamentos = sqliteTable("orcamentos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mes: text("mes").notNull().unique(),
  valorCentavos: integer("valor_centavos").notNull(),
  criadoEm: text("criado_em")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type Cartao = typeof cartoes.$inferSelect;
export type Renda = typeof rendas.$inferSelect;
export type CompraCartao = typeof comprasCartao.$inferSelect;
export type Orcamento = typeof orcamentos.$inferSelect;
export type CustoFixo = typeof custosFixos.$inferSelect;
export type CustoVariavel = typeof custosVariaveis.$inferSelect;
