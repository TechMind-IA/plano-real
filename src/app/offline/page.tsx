import Link from "next/link";

export const metadata = {
  title: "Offline — Finanças",
};

export default function OfflinePage() {
  return (
    <div className="page offline-page">
      <div className="offline-card">
        <h1>Você está offline</h1>
        <p>Sem conexão com a internet. Verifique sua rede e tente novamente.</p>
        <Link href="/" className="btn btn-primary">
          Tentar novamente
        </Link>
      </div>
    </div>
  );
}
