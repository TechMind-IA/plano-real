import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export type Usuario = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>["user"];

/* Sessão atual (null = sem login). */
export async function usuarioSessao(): Promise<Usuario | null> {
  const sessao = await auth.api.getSession({ headers: await headers() });
  return sessao?.user ?? null;
}

/* Exige login — redireciona para /login se não houver sessão.
   Usado em todas as pages e server actions. */
export async function exigirUsuario(): Promise<Usuario> {
  const usuario = await usuarioSessao();
  if (!usuario) redirect("/login");
  return usuario;
}

/* Exige conta admin (usada para gerir convites). */
export async function exigirAdmin(): Promise<Usuario> {
  const usuario = await exigirUsuario();
  if (usuario.role !== "admin") redirect("/");
  return usuario;
}
