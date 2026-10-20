/* Mensagens amigáveis (pt-BR) para os códigos de erro do better-auth. */

export function mensagemErroAuth(
  codigo: string | undefined,
  contexto: "login" | "cadastro",
): string {
  switch (codigo) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "E-mail ou senha incorretos.";
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "Já existe uma conta cadastrada com este e-mail.";
    case "INVALID_PASSWORD":
    case "PASSWORD_TOO_SHORT":
      return "A senha precisa ter pelo menos 8 caracteres.";
    case "TOO_MANY_REQUESTS":
      return "Muitas tentativas. Aguarde um minuto e tente de novo.";
    case "EMAIL_PASSWORD_DISABLED":
    case "EMAIL_PASSWORD_SIGN_UP_DISABLED":
      return "Login por e-mail e senha indisponível.";
    default:
      return contexto === "login"
        ? "Não foi possível entrar. Tente novamente."
        : "Não foi possível criar a conta. Verifique o convite e tente de novo.";
  }
}
