"use client";

import { LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";

/* Sai da conta e limpa o cache do service worker — assim o PWA offline
   não deixa páginas com dados de outro usuário. */
export default function BotaoSair() {
  async function sair() {
    try {
      await authClient.signOut();
    } catch {
      /* segue mesmo se a chamada falhar */
    }
    try {
      if ("caches" in window) {
        const chaves = await caches.keys();
        await Promise.all(chaves.map((chave) => caches.delete(chave)));
      }
    } catch {
      /* sem Cache API (ou sem permissão) */
    }
    window.location.href = "/login";
  }

  return (
    <button
      type="button"
      className="icon-btn"
      onClick={sair}
      aria-label="Sair da conta"
      title="Sair da conta"
    >
      <span className="ic">
        <LogOut />
      </span>
    </button>
  );
}
