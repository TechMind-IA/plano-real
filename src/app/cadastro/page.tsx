import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { buscarConviteValido, normalizarCodigo } from "@/lib/convites";
import { usuarioSessao } from "@/lib/sessao";
import FormCadastro from "./FormCadastro";

export const dynamic = "force-dynamic";

export default async function PaginaCadastro({
  searchParams,
}: {
  searchParams: Promise<{ convite?: string }>;
}) {
  if (await usuarioSessao()) redirect("/");

  const { convite } = await searchParams;
  const codigo = convite ? normalizarCodigo(convite) : null;
  const registro = await buscarConviteValido(codigo);

  return (
    <div className="page">
      <div className="greeting">
        <div className="greeting-text">
          <h1>Finanças</h1>
          <small>Criar conta com convite</small>
        </div>
        <span className="avatar" aria-hidden>
          F
        </span>
      </div>

      {codigo && registro ? (
        <>
          <p className="pill ok" style={{ margin: "4px 24px 8px", alignSelf: "flex-start" }}>
            Convite válido{registro.email ? ` · ${registro.email}` : ""}
          </p>
          <FormCadastro codigo={codigo} emailSugerido={registro.email ?? undefined} />
          <p className="auth-rodape">
            Já tem conta? <Link href="/login">Entrar</Link>
          </p>
        </>
      ) : (
        <>
          <div className="form-erro" role="alert">
            <span
              className="ic"
              style={{ verticalAlign: "-4px", marginRight: 6 }}
              aria-hidden
            >
              <AlertTriangle size={16} />
            </span>
            {codigo
              ? "Este convite é inválido, já foi usado ou expirou."
              : "O cadastro é por convite. Peça um link de convite para começar."}
          </div>
          <p className="auth-rodape">
            Já tem conta? <Link href="/login">Entrar</Link>
          </p>
        </>
      )}
    </div>
  );
}
