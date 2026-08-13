import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

/* Singleton global: sobrevive ao hot-reload do dev server sem abrir
   uma conexão nova a cada recompilação. */
const globalParaDb = globalThis as unknown as {
  _db?: BetterSQLite3Database<typeof schema>;
};

function criarConexao() {
  const sqlite = new Database("financas.db");
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return drizzle(sqlite, { schema });
}

export const db = globalParaDb._db ?? criarConexao();
if (process.env.NODE_ENV !== "production") globalParaDb._db = db;
