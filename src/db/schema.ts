import { sql } from "drizzle-orm";
import { boolean, integer, pgTable, serial, text, unique } from "drizzle-orm/pg-core";
import { user } from "@/db/auth-schema";

/* Tabelas do better-auth (user, session, account, verification) —
   geradas pelo CLI em auth-schema.ts e reexportadas aqui para que
   `import * as schema` (conexão e adapter) as enxergue. */
export * from "@/db/auth-schema";

/* ============================================================
   Schema multiusuário (Neon/Postgres).
   Convenções:
   - dinheiro continua integer em CENTAVOS;
   - datas/meses continuam text ISO (YYYY-MM-DD / YYYY-MM);
   - booleanos são boolean de verdade;
   - criado_em continua text.
   Toda linha pertence a um usuário via usuario_id (→ user.id).
   ============================================================ */

export const cartoes = pgTable("cartoes", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  bandeira: text("bandeira"),
  limiteCentavos: integer("limite_centavos"),
  diaFechamento: integer("dia_fechamento"),
  diaVencimento: integer("dia_vencimento"),
  usuarioId: text("usuario_id").references(() => user.id, { onDelete: "cascade" }),
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
  usuarioId: text("usuario_id").references(() => user.id, { onDelete: "cascade" }),
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
  usuarioId: text("usuario_id").references(() => user.id, { onDelete: "cascade" }),
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
  usuarioId: text("usuario_id").references(() => user.id, { onDelete: "cascade" }),
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
  usuarioId: text("usuario_id").references(() => user.id, { onDelete: "cascade" }),
  criadoEm: text("criado_em")
    .notNull()
    .default(sql`(now())::text`),
});

/* Fallback manual do orçamento quando não há renda cadastrada. */
export const orcamentos = pgTable(
  "orcamentos",
  {
    id: serial("id").primaryKey(),
    mes: text("mes").notNull(),
    valorCentavos: integer("valor_centavos").notNull(),
    usuarioId: text("usuario_id").references(() => user.id, { onDelete: "cascade" }),
    criadoEm: text("criado_em")
      .notNull()
      .default(sql`(now())::text`),
  },
  (t) => [unique("orcamentos_usuario_mes_unique").on(t.usuarioId, t.mes)],
);

/* Convites para cadastro (cadastro por convite). O código também é
   validado no hook do better-auth (src/lib/auth.ts) via cookie. */
export const convites = pgTable("convites", {
  id: serial("id").primaryKey(),
  codigo: text("codigo").notNull().unique(),
  email: text("email"),
  criadoPor: text("criado_por").references(() => user.id, { onDelete: "set null" }),
  validoAte: text("valido_ate"),
  usadoPor: text("usado_por").references(() => user.id, { onDelete: "set null" }),
  usadoEm: text("usado_em"),
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
export type Convite = typeof convites.$inferSelect;
