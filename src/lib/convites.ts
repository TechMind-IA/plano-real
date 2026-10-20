import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { convites } from "@/db/schema";
import { hojeISO, somarDias } from "@/lib/datas";

/* Cadastro por convite: código único, compartilhado manualmente.
   A validação acontece em dois pontos — na página /cadastro (feedback
   amigável) e no hook do better-auth (src/lib/auth.ts), que lê o cookie
   `convite` da requisição e bloqueia o sign-up sem convite válido. */

export function normalizarCodigo(codigo: string): string {
  return codigo.trim().toUpperCase();
}

export async function buscarConviteValido(codigo: string | null | undefined) {
  if (!codigo) return null;
  const [convite] = await db
    .select()
    .from(convites)
    .where(eq(convites.codigo, normalizarCodigo(codigo)));
  if (!convite || convite.usadoPor) return null;
  if (convite.validoAte && convite.validoAte < hojeISO()) return null;
  return convite;
}

/* Consumo idempotente: só marca se ainda não foi usado. */
export async function consumirConvite(codigo: string, usuarioId: string) {
  await db
    .update(convites)
    .set({ usadoPor: usuarioId, usadoEm: hojeISO() })
    .where(
      and(
        eq(convites.codigo, normalizarCodigo(codigo)),
        isNull(convites.usadoPor),
      ),
    );
}

/* Código legível sem caracteres ambíguos (0/O, 1/I/L). */
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function gerarCodigoConvite(tamanho = 8): string {
  const bytes = new Uint8Array(tamanho);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join("");
}

export function validadeConvitePadrao(): string {
  return somarDias(hojeISO(), 30);
}
