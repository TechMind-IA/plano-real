# Migração: SQLite local → Neon (Postgres) + deploy na Vercel

Guia completo da migração do banco deste app. Escrito para ser executado por
uma pessoa ou por outra IA — cada passo é verificável antes do seguinte.

## Contexto do projeto

- App Next.js (App Router) de finanças pessoais, mobile-first, pt-BR.
- ORM: **Drizzle**. Banco atual: **SQLite** (`financas.db` na raiz, driver
  `better-sqlite3`). Destino: **Neon (Postgres)**, deploy na **Vercel**.
- Convenções que a migração **preserva** (não converta nada disso):
  - Dinheiro é `integer` em **centavos**. Nunca float, nunca decimal.
  - Datas e meses são `text` ISO: `YYYY-MM-DD` e `YYYY-MM`. O app filtra mês
    com `LIKE 'YYYY-MM%'` e compara meses como string — funciona idêntico no
    Postgres, não "melhore" para tipos date.
  - As **parcelas de cartão não existem no banco** — são derivadas em runtime
    (`src/lib/faturas.ts`) a partir da compra + ciclo do cartão. Não há nada
    para migrar nelas.
- Tabelas (6): `cartoes`, `rendas`, `custos_fixos`, `custos_variaveis`,
  `compras_cartao`, `orcamentos`. Foreign keys: `custos_variaveis.cartao_id`
  (SET NULL) e `compras_cartao.cartao_id` (CASCADE) → **IDs precisam ser
  preservados** na migração de dados.

## Arquivos já preparados neste repositório

| Arquivo | Papel |
|---|---|
| `src/db/schema.pg.ts` | Schema Postgres pronto (paridade 1:1 com o SQLite). Substitui `schema.ts`. |
| `src/db/index.pg.ts` | Conexão Neon via `@neondatabase/serverless`. Substitui `index.ts`. |
| `scripts/migrar-neon.mjs` | Script de dados: lê `financas.db`, insere no Neon em transação, preserva IDs, reposiciona sequences e confere contagens + somas. |

Diferenças de dialeto já resolvidas no `schema.pg.ts`:

- `integer` autoincrement → `serial` (aceita insert com id explícito, que o
  script usa; sequence é reposicionada depois).
- Booleanos `ativo`/`recorrente`: no SQLite são 0/1; no Postgres são `boolean`.
  O script converte na carga.
- Default `datetime('now')` → `(now())::text` (`criado_em` continua text).
- Nada mais muda: as queries do app (via Drizzle) são compatíveis com os dois
  dialetos, incluindo `like()` e `onConflictDoUpdate` (usado em `orcamentos`).

## Passo a passo

### 1. Criar o banco no Neon

1. Criar projeto em https://neon.tech (região `sa-east-1`/South America, se
   disponível, pela latência).
2. Copiar a **connection string** (formato
   `postgresql://usuario:senha@ep-xxx.neon.tech/neondb?sslmode=require`).
3. Criar `.env.local` na raiz com:
   ```
   DATABASE_URL="postgresql://..."
   ```
   E adicionar `.env.local` ao `.gitignore` se ainda não estiver (o
   create-next-app já ignora `.env*`).

### 2. Instalar dependências novas

`@neondatabase/serverless` **já está instalado** neste repositório. Falta só o
driver do script de dados:

```bash
npm install -D pg
```

(`pg` é usado só por `scripts/migrar-neon.mjs`; `better-sqlite3` ainda é
necessário nesta fase — **não remova antes do passo 5**.)

### 3. Ativar o schema e a conexão Postgres

```bash
# backup dos originais SQLite (para rollback fácil)
mv src/db/schema.ts src/db/schema.sqlite.ts.bak
mv src/db/index.ts src/db/index.sqlite.ts.bak
mv src/db/schema.pg.ts src/db/schema.ts
mv src/db/index.pg.ts src/db/index.ts
```

Substituir o conteúdo de `drizzle.config.ts` por:

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

Em `next.config.ts`, remover a linha `serverExternalPackages: ["better-sqlite3"]`
(pode remover o objeto `experimental.serverActions`/`allowedDevOrigins` também
se não for mais usar ngrok em dev — são independentes da migração).

### 4. Criar as tabelas no Neon

```bash
npx dotenv -e .env.local -- npx drizzle-kit push
# ou: DATABASE_URL="postgresql://..." npx drizzle-kit push
```

Verificar: deve criar as 6 tabelas sem warnings de perda de dados (banco vazio).

### 5. Migrar os dados

```bash
DATABASE_URL="postgresql://..." node scripts/migrar-neon.mjs
```

O script:
- aborta se as tabelas de destino não existirem ou não estiverem vazias
  (`--force` sobrepõe a checagem de vazio);
- roda tudo numa transação (ou migra tudo, ou nada);
- preserva os IDs e reposiciona as sequences;
- ao final imprime a verificação: contagem de linhas e soma dos centavos de
  cada tabela, local × Neon. **Só prossiga se todas as linhas terminarem em
  contagens iguais e "soma confere".**

### 6. Validar o app localmente contra o Neon

```bash
npm run build && npm run dev
```

Checklist manual (dados reais devem aparecer idênticos):

- [ ] Home: visão geral com os mesmos totais de antes; badge de contagens.
- [ ] `/agenda`: cota do dia igual à de antes da migração (mesmo valor em
      "Disponível para gastar hoje", "Renda do mês", "Faturas de cartão no mês").
- [ ] `/cartoes/[id]`: fatura do mês atual bate com o valor pré-migração;
      parcelas "x/y" e assinaturas aparecem; limite disponível igual.
- [ ] Criar um gasto de teste na agenda, editá-lo e excluí-lo (testa insert,
      update com id, delete e as revalidações).
- [ ] Criar e excluir um item em `/renda` e `/fixos`.

### 7. Limpeza do SQLite

Somente depois do passo 6 passar:

```bash
npm uninstall better-sqlite3 @types/better-sqlite3
git rm --cached financas.db 2>/dev/null; true
```

Remover do `package.json` nada além disso (os scripts `db:push`/`db:studio`
continuam funcionando com Postgres). Os arquivos `financas.db*` e
`*.bak` podem ficar no disco como backup histórico — já estão fora do git.

### 8. Deploy na Vercel

1. Subir o repositório para o GitHub (repo privado).
2. Na Vercel: **Add New Project** → importar o repo. Framework é detectado
   (Next.js), sem configuração extra de build.
3. Em **Settings → Environment Variables**, criar `DATABASE_URL` com a
   connection string do Neon (Production e Preview).
4. Deploy. Testar o checklist do passo 6 na URL `*.vercel.app` gerada.

## Rollback

Enquanto o passo 7 não for executado, voltar ao SQLite é só desfazer os
renames do passo 3 (`.bak` → nomes originais), restaurar o
`drizzle.config.ts` de sqlite (dialect `sqlite`, url `./financas.db`) e a linha
`serverExternalPackages: ["better-sqlite3"]` no `next.config.ts`. O
`financas.db` local permanece intocado durante toda a migração (o script abre
em modo somente-leitura).

## Armadilhas conhecidas

- **Não** rode o script de dados antes do `drizzle-kit push` — ele aborta, mas
  não perca tempo.
- **Não** troque `serial` por `generatedAlwaysAsIdentity` no schema — o insert
  com id explícito do script deixaria de funcionar sem `OVERRIDING SYSTEM VALUE`.
- **Não** converta `data`/`mes`/`criado_em` para tipos date/timestamp — o app
  compara strings ISO de propósito.
- O driver `neon-http` não suporta transações multi-statement no app — hoje
  nenhuma action precisa; se algum dia precisar, trocar para
  `drizzle-orm/neon-serverless` (WebSocket) é uma mudança só no `src/db/index.ts`.
- `.env.local` nunca vai para o git nem para a Vercel — lá a env é configurada
  no painel.
