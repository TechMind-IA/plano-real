import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { buscarConviteValido, consumirConvite } from "@/lib/convites";

/* O código de convite chega no sign-up como cookie `convite`
   (definido pela página /cadastro antes de chamar signUp.email). */
function lerCodigoConvite(
  contexto: {
    getCookie?: (chave: string) => string | null;
    request?: Request;
  } | null,
): string | null {
  if (!contexto) return null;
  try {
    const direto = contexto.getCookie?.("convite");
    if (direto) return direto;
  } catch {
    /* segue para o parser manual */
  }
  const bruto = contexto.request?.headers?.get("cookie");
  if (!bruto) return null;
  for (const trecho of bruto.split(";")) {
    const [chave, ...resto] = trecho.trim().split("=");
    if (chave === "convite") return decodeURIComponent(resto.join("="));
  }
  return null;
}

/* Instância única do better-auth — e-mail + senha, sessões em banco
   (Neon/Postgres via Drizzle). O secret e a URL vêm das env
   BETTER_AUTH_SECRET / BETTER_AUTH_URL. */
export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        returned: true,
        input: false,
      },
    },
  },
  /* Cadastro por convite: sem código válido o usuário não é criado
     (nem chamando /api/auth/sign-up/email direto). Quem cria o
     usuário é marcado no convite logo depois. */
  databaseHooks: {
    user: {
      create: {
        before: async (usuario, contexto) => {
          const codigo = lerCodigoConvite(contexto);
          const convite = await buscarConviteValido(codigo);
          if (!convite) return false;
        },
        after: async (usuario, contexto) => {
          const codigo = lerCodigoConvite(contexto);
          if (codigo) await consumirConvite(codigo, usuario.id);
        },
      },
    },
  },
  database: drizzleAdapter(db, { provider: "pg", schema }),
  plugins: [nextCookies()],
});
