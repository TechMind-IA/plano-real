"use client";

import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { mensagemErroAuth } from "@/lib/erros-auth";

export default function FormLogin() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, setPendente] = useState(false);

  async function entrar(evento: FormEvent) {
    evento.preventDefault();
    setPendente(true);
    setErro(null);

    const { error } = await authClient.signIn.email({
      email: email.trim(),
      password: senha,
    });

    if (error) {
      setErro(mensagemErroAuth(error.code, "login"));
      setPendente(false);
      return;
    }

    window.location.href = "/";
  }

  return (
    <form onSubmit={entrar}>
      <div className="card auth-card">
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
          />
        </label>
        <label className="field">
          <span className="field-label">Senha</span>
          <input
            className="field-input"
            type="password"
            name="senha"
            autoComplete="current-password"
            placeholder="••••••••"
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
          {pendente ? "Entrando..." : "Entrar"}
        </button>
      </div>
    </form>
  );
}
