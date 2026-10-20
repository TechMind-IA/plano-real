import { createAuthClient } from "better-auth/react";

/* Cliente usado nas telas /login e /cadastro (e no botão de sair).
   Aponta para o mesmo origin — o handler fica em
   /api/auth/[...all]/route.ts. */
export const authClient = createAuthClient();
