import { defineConfig } from "drizzle-kit";

/* Fase SQLite. Na migração para o Neon: dialect "postgresql",
   dbCredentials.url = process.env.DATABASE_URL e ajustar o schema
   para drizzle-orm/pg-core. */
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: { url: "./financas.db" },
});
