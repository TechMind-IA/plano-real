/* ============================================================
   VERSÃO POSTGRES (Neon) da conexão — ainda NÃO está em uso.
   Na migração, este arquivo SUBSTITUI o index.ts (ver
   MIGRACAO-NEON.md). Requer: npm install @neondatabase/serverless
   e a env DATABASE_URL (connection string do Neon).
   ============================================================ */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não definida — configure a connection string do Neon.");
}

const conexao = neon(process.env.DATABASE_URL);

export const db = drizzle(conexao, { schema });
