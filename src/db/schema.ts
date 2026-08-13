import { sql } from "drizzle-orm";
import { boolean, integer, pgTable, serial, text } from "drizzle-orm/pg-core";

/* ============================================================
   VERSÃO POSTGRES (Neon) do schema — ainda NÃO está em uso.
   Na migração, este arquivo SUBSTITUI o schema.ts (ver
   MIGRACAO-NEON.md). Mantido em paridade 1:1 com o SQLite:
   - dinheiro continua integer em CENTAVOS;
   - datas/meses continuam text ISO (YYYY-MM-DD / YYYY-MM) —
     os filtros LIKE e comparações lexicográficas do app
     funcionam idênticos;
   - booleanos viram boolean de verdade (no SQLite eram 0/1);
   - criado_em continua text para migrar os valores como estão.
   ============================================================ */

export const cartoes = pgTable("cartoes", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  bandeira: text("bandeira"),
  limiteCentavos: integer("limite_centavos"),
  diaFechamento: integer("dia_fechamento"),
  diaVencimento: integer("dia_vencimento"),
  criadoEm: text("criado_em")
    .notNull()
    .default(sql`(now())::text`),
});

/* Renda: recorrente (`mes` null, vale todo mês) ou variável
   (`mes` YYYY-MM, vale só naquele mês). */
export const rendas = pgTable("rendas", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  categoria: text("categoria").notNull().default("Outros"),
  valorCentavos: integer("valor_centavos").notNull(),
  diaRecebimento: integer("dia_recebimento"),
  mes: text("mes"),
  ativo: boolean("ativo").notNull().default(true),
  criadoEm: text("criado_em")
    .notNull()
    .default(sql`(now())::text`),
});

export const custosFixos = pgTable("custos_fixos", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  categoria: text("categoria").notNull().default("Outros"),
  valorCentavos: integer("valor_centavos").notNull(),
  diaVencimento: integer("dia_vencimento"),
  ativo: boolean("ativo").notNull().default(true),
  criadoEm: text("criado_em")
    .notNull()
    .default(sql`(now())::text`),
});

export const custosVariaveis = pgTable("custos_variaveis", {
  id: serial("id").primaryKey(),
  descricao: text("descricao").notNull(),
  categoria: text("categoria").notNull().default("Outros"),
  valorCentavos: integer("valor_centavos").notNull(),
  data: text("data").notNull(),
  cartaoId: integer("cartao_id").references(() => cartoes.id, {
    onDelete: "set null",
  }),
  criadoEm: text("criado_em")
    .notNull()
    .default(sql`(now())::text`),
});

/* Compra no cartão: parcelas derivadas em runtime (src/lib/faturas.ts).
   Assinatura: recorrente=true repete o valor cheio até fim_mes. */
export const comprasCartao = pgTable("compras_cartao", {
  id: serial("id").primaryKey(),
  cartaoId: integer("cartao_id")
    .notNull()
    .references(() => cartoes.id, { onDelete: "cascade" }),
  descricao: text("descricao").notNull(),
  categoria: text("categoria").notNull().default("Outros"),
  valorTotalCentavos: integer("valor_total_centavos").notNull(),
  parcelas: integer("parcelas").notNull().default(1),
  data: text("data").notNull(),
  recorrente: boolean("recorrente").notNull().default(false),
  fimMes: text("fim_mes"),
  criadoEm: text("criado_em")
    .notNull()
    .default(sql`(now())::text`),
});

/* Fallback manual do orçamento quando não há renda cadastrada. */
export const orcamentos = pgTable("orcamentos", {
  id: serial("id").primaryKey(),
  mes: text("mes").notNull().unique(),
  valorCentavos: integer("valor_centavos").notNull(),
  criadoEm: text("criado_em")
    .notNull()
    .default(sql`(now())::text`),
});

export type Cartao = typeof cartoes.$inferSelect;
export type Renda = typeof rendas.$inferSelect;
export type CustoFixo = typeof custosFixos.$inferSelect;
export type CustoVariavel = typeof custosVariaveis.$inferSelect;
export type CompraCartao = typeof comprasCartao.$inferSelect;
export type Orcamento = typeof orcamentos.$inferSelect;
