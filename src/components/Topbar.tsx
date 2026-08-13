import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function Topbar({
  titulo,
  subtitulo,
}: {
  titulo: string;
  subtitulo?: string;
}) {
  return (
    <header className="topbar">
      <Link href="/" className="icon-btn" aria-label="Voltar ao início">
        <span className="ic">
          <ArrowLeft />
        </span>
      </Link>
      <div className="topbar-title">
        <strong>{titulo}</strong>
        {subtitulo ? <small>{subtitulo}</small> : null}
      </div>
      <span style={{ width: 44 }} aria-hidden />
    </header>
  );
}
