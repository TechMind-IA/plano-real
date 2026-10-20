/* Cria a conta admin inicial e migra TODOS os dados existentes no
   banco para essa conta (backfill de usuario_id nas 6 tabelas).

   Uso:
     npm run db:seed -- "email@exemplo.com" "senha-forte" "Diego"

   - Se o e-mail já tiver conta, ela é reutilizada (só refaz o backfill).
   - O sign-up passa pelo fluxo real de convite (hook do better-auth).
   - Depois rode o push fase B (coluna usuario_id NOT NULL). */

import { readFileSync } from "node:fs";
import { count, eq, isNull } from "drizzle-orm";

function carregarEnvLocal() {
  try {
    process.loadEnvFile(".env.local");
    return;
  } catch {
    /* fallback: parse manual */
  }
  try {
    const texto = readFileSync(".env.local", "utf8");
    for (const linha of texto.split("\n")) {
      const corte = linha.indexOf("=");
      if (corte <= 0) continue;
      const chave = linha.slice(0, corte).trim();
      if (!chave || chave.startsWith("#")) continue;
      if (!process.env[chave]) process.env[chave] = linha.slice(corte + 1);
    }
  } catch {
    /* sem .env.local */
  }
}

async function main() {
  carregarEnvLocal();

  const [email, senha, nome] = process.argv.slice(2);
  if (!email || !senha) {
    console.error(
      'Uso: npm run db:seed -- "email@exemplo.com" "senha-forte" "Nome"',
    );
    process.exit(1);
  }

  const { auth } = await import("../src/lib/auth");
  const { db } = await import("../src/db");
  const {
    user,
    cartoes,
    comprasCartao,
    custosFixos,
    custosVariaveis,
    orcamentos,
    rendas,
    convites,
  } = await import("../src/db/schema");
  const { gerarCodigoConvite, validadeConvitePadrao } = await import(
    "../src/lib/convites"
  );
  const { hojeISO } = await import("../src/lib/datas");

  /* 1. Conta existe? */
  const [existente] = await db
    .select({ id: user.id, role: user.role })
    .from(user)
    .where(eq(user.email, email.trim()));

  let usuarioId: string;

  if (existente) {
    usuarioId = existente.id;
    console.log(`• Conta já existe: ${email} (${usuarioId})`);
  } else {
    /* 2. Cria um convite de uso único e passa por ele — o mesmo caminho
          de qualquer cadastro (validação no hook de src/lib/auth.ts). */
    const codigo = gerarCodigoConvite();
    await db.insert(convites).values({
      codigo,
      email: email.trim(),
      validoAte: validadeConvitePadrao(),
    });

    await auth.api.signUpEmail({
      body: {
        email: email.trim(),
        password: senha,
        name: (nome ?? "Diego").trim(),
      },
      headers: new Headers({
        origin: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
        cookie: `convite=${codigo}`,
      }),
    });

    const [criado] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, email.trim()));
    if (!criado) {
      console.error("✗ Sign-up não criou a usuário — veja os erros acima.");
      process.exit(1);
    }
    usuarioId = criado.id;

    /* Garante o consumo do convite (o hook after pode estar enfileirado). */
    await db
      .update(convites)
      .set({ usadoPor: usuarioId, usadoEm: hojeISO() })
      .where(eq(convites.codigo, codigo));

    console.log(`• Conta criada: ${email} (${usuarioId})`);
  }

  /* 3. Papel admin. */
  await db.update(user).set({ role: "admin" }).where(eq(user.id, usuarioId));
  console.log("• Papel definido: admin");

  /* 4. Backfill: todas as linhas órfãs passam a pertencer ao admin. */
  const tabelas = [
    { nome: "cartoes", tabela: cartoes },
    { nome: "rendas", tabela: rendas },
    { nome: "custos_fixos", tabela: custosFixos },
    { nome: "custos_variaveis", tabela: custosVariaveis },
    { nome: "compras_cartao", tabela: comprasCartao },
    { nome: "orcamentos", tabela: orcamentos },
  ] as const;

  let total = 0;
  for (const { nome: nomeTabela, tabela } of tabelas) {
    const [contagem] = await db
      .select({ n: count() })
      .from(tabela)
      .where(isNull(tabela.usuarioId));
    if (contagem.n > 0) {
      await db
        .update(tabela)
        .set({ usuarioId })
        .where(isNull(tabela.usuarioId));
    }
    total += contagem.n;
    console.log(`• ${nomeTabela}: ${contagem.n} linha(s) migrada(s)`);
  }

  console.log(`\n✓ Pronto. ${total} linha(s) agora pertencem a ${email}.`);
  console.log("Próximo passo: aplicar o push fase B (usuario_id NOT NULL).");
}

main().catch((erro) => {
  console.error("✗ Falha no seed:", erro);
  process.exit(1);
});
