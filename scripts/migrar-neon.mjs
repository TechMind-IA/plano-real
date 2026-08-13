/* ============================================================
   Migração de dados: financas.db (SQLite local) → Neon (Postgres).

   Pré-requisitos (ver MIGRACAO-NEON.md):
   1. Tabelas já criadas no Neon (npx drizzle-kit push com o
      schema Postgres ativo);
   2. npm install pg  (driver usado só por este script);
   3. better-sqlite3 ainda instalado (leitura do banco local);
   4. DATABASE_URL apontando para o Neon.

   Uso:
     DATABASE_URL="postgres://..." node scripts/migrar-neon.mjs
     ... --force  (permite rodar com tabelas de destino não vazias)

   O script é transacional: ou migra tudo, ou não migra nada.
   IDs são preservados (as foreign keys dependem deles) e as
   sequences do Postgres são reposicionadas ao final.
   ============================================================ */

import Database from "better-sqlite3";

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) {
  console.error("Erro: defina DATABASE_URL com a connection string do Neon.");
  process.exit(1);
}

let pg;
try {
  pg = await import("pg");
} catch {
  console.error("Erro: driver pg não instalado. Rode: npm install pg");
  process.exit(1);
}

const force = process.argv.includes("--force");

/* Ordem respeita as foreign keys: cartoes antes de custos_variaveis
   (cartao_id) e compras_cartao (cartao_id). Booleanos do SQLite (0/1)
   são convertidos para boolean do Postgres. */
const TABELAS = [
  {
    nome: "cartoes",
    colunas: ["id", "nome", "bandeira", "limite_centavos", "dia_fechamento", "dia_vencimento", "criado_em"],
    booleanas: [],
  },
  {
    nome: "rendas",
    colunas: ["id", "nome", "categoria", "valor_centavos", "dia_recebimento", "mes", "ativo", "criado_em"],
    booleanas: ["ativo"],
  },
  {
    nome: "custos_fixos",
    colunas: ["id", "nome", "categoria", "valor_centavos", "dia_vencimento", "ativo", "criado_em"],
    booleanas: ["ativo"],
  },
  {
    nome: "custos_variaveis",
    colunas: ["id", "descricao", "categoria", "valor_centavos", "data", "cartao_id", "criado_em"],
    booleanas: [],
  },
  {
    nome: "compras_cartao",
    colunas: ["id", "cartao_id", "descricao", "categoria", "valor_total_centavos", "parcelas", "data", "recorrente", "fim_mes", "criado_em"],
    booleanas: ["recorrente"],
  },
  {
    nome: "orcamentos",
    colunas: ["id", "mes", "valor_centavos", "criado_em"],
    booleanas: [],
  },
];

const sqlite = new Database("financas.db", { readonly: true });
const cliente = new pg.default.Client({ connectionString: DATABASE_URL });
await cliente.connect();

try {
  /* Confere destino: tabelas existem e estão vazias. */
  for (const t of TABELAS) {
    let total;
    try {
      total = await cliente.query(`SELECT count(*)::int AS n FROM "${t.nome}"`);
    } catch {
      throw new Error(
        `Tabela "${t.nome}" não existe no Neon. Rode antes: npx drizzle-kit push (com o schema Postgres ativo).`,
      );
    }
    if (total.rows[0].n > 0 && !force) {
      throw new Error(
        `Tabela "${t.nome}" no Neon já tem ${total.rows[0].n} linhas. Use --force para migrar mesmo assim (risco de conflito de id).`,
      );
    }
  }

  await cliente.query("BEGIN");

  const resumo = [];
  for (const t of TABELAS) {
    const linhas = sqlite.prepare(`SELECT ${t.colunas.join(", ")} FROM ${t.nome} ORDER BY id`).all();

    for (const linha of linhas) {
      const valores = t.colunas.map((c) =>
        t.booleanas.includes(c) ? Boolean(linha[c]) : (linha[c] ?? null),
      );
      const marcadores = t.colunas.map((_, i) => `$${i + 1}`).join(", ");
      await cliente.query(
        `INSERT INTO "${t.nome}" (${t.colunas.map((c) => `"${c}"`).join(", ")}) VALUES (${marcadores})`,
        valores,
      );
    }

    /* Reposiciona a sequence do serial para continuar após o maior id. */
    if (linhas.length > 0) {
      await cliente.query(
        `SELECT setval(pg_get_serial_sequence('"${t.nome}"', 'id'), (SELECT max(id) FROM "${t.nome}"))`,
      );
    }

    resumo.push({ tabela: t.nome, migradas: linhas.length });
  }

  await cliente.query("COMMIT");

  /* Verificação pós-migração: contagens e somas de centavos batem? */
  console.log("\nMigração concluída. Verificação:");
  let tudoOk = true;
  for (const t of TABELAS) {
    const nLocal = sqlite.prepare(`SELECT count(*) AS n FROM ${t.nome}`).get().n;
    const nNeon = (await cliente.query(`SELECT count(*)::int AS n FROM "${t.nome}"`)).rows[0].n;

    const colValor = t.colunas.find((c) => c.includes("centavos"));
    let somaOk = true;
    if (colValor) {
      const sLocal = sqlite.prepare(`SELECT coalesce(sum(${colValor}),0) AS s FROM ${t.nome}`).get().s;
      const sNeon = Number(
        (await cliente.query(`SELECT coalesce(sum("${colValor}"),0) AS s FROM "${t.nome}"`)).rows[0].s,
      );
      somaOk = Number(sLocal) === sNeon;
    }

    const ok = nLocal === nNeon && somaOk;
    tudoOk = tudoOk && ok;
    console.log(
      `  ${ok ? "OK " : "ERRO"} ${t.nome}: ${nLocal} → ${nNeon} linhas${colValor ? (somaOk ? " · soma confere" : " · SOMA DIVERGE") : ""}`,
    );
  }

  console.log(tudoOk ? "\nTudo certo — dados migrados e conferidos." : "\nATENÇÃO: divergências acima. Investigue antes de usar.");
  process.exit(tudoOk ? 0 : 2);
} catch (erro) {
  await cliente.query("ROLLBACK").catch(() => {});
  console.error(`\nMigração abortada (nada foi gravado): ${erro.message}`);
  process.exit(1);
} finally {
  await cliente.end();
  sqlite.close();
}
