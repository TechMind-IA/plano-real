"use client";

import { useOffline } from "next/offline";

export default function AvisoOffline() {
  const isOffline = useOffline();

  if (!isOffline) return null;

  return (
    <div className="offline-banner" role="status">
      Você está offline. Alterações serão reenviadas quando a conexão voltar.
    </div>
  );
}
