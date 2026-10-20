import Link from "next/link";
import { redirect } from "next/navigation";
import { usuarioSessao } from "@/lib/sessao";
import FormLogin from "./FormLogin";

export const dynamic = "force-dynamic";

export default async function PaginaLogin() {
  /* Sessão válida não fica na tela de login. Só redireciona quando a
     sessão realmente existe — evita loop com cookie expirado. */
  if (await usuarioSessao()) redirect("/");

  return (
    <div className="page">
      <div className="greeting">
        <div className="greeting-text">
          <h1>Finanças</h1>
          <small>Entre na sua conta</small>
        </div>
        <span className="avatar" aria-hidden>
          F
        </span>
      </div>

      <FormLogin />

      <p className="auth-rodape">
        Recebeu um convite? <Link href="/cadastro">Criar conta</Link>
      </p>
    </div>
  );
}
