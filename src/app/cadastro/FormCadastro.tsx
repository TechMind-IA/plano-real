"use client";

import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { mensagemErroAuth } from "@/lib/erros-auth";

/* O código de convite vai como cookie para o hook do better-auth
   (src/lib/auth.ts) validar no sign-up — mesmo se alguém chamar
   /api/auth/sign-up/email direto, sem cookie o usuário não é criado. */
export default function FormCadastro({
  codigo,
  emailSugerido,
}: {
  codigo: string;
  emailSugerido?: string;
}) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState(emailSugerido ?? "");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, setPendente] = useState(false);

  async function criar(evento: FormEvent) {
    evento.preventDefault();
    setPendente(true);
    setErro(null);

    document.cookie = `convite=${encodeURIComponent(codigo)}; path=/; max-age=600; samesite=lax`;

    const { error } = await authClient.signUp.email({
      name: nome.trim(),
      email: email.trim(),
      password: senha,
    });

    document.cookie = "convite=; path=/; max-age=0";

    if (error) {
      setErro(mensagemErroAuth(error.code, "cadastro"));
      setPendente(false);
      return;
    }

    window.location.href = "/";
  }

  return (
    <form onSubmit={criar}>
      <div className="card auth-card">
        <label className="field">
          <span className="field-label">Nome</span>
          <input
            className="field-input"
            type="text"
            name="nome"
            autoComplete="name"
            placeholder="Como quer ser chamado"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span className="field-label">E-mail</span>
          <input
            className="field-input"
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            placeholder="voce@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            readOnly={Boolean(emailSugerido)}
          />
        </label>
        <label className="field">
          <span className="field-label">Senha</span>
          <input
            className="field-input"
            type="password"
            name="senha"
            autoComplete="new-password"
            placeholder="Mínimo de 8 caracteres"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            minLength={8}
          />
        </label>
      </div>

      {erro ? (
        <p className="form-erro" role="alert">
          {erro}
        </p>
      ) : null}

      <div className="auth-cta">
        <button type="submit" className="cta" disabled={pendente}>
          {pendente ? "Criando conta..." : "Criar conta"}
        </button>
      </div>
    </form>
  );
}
