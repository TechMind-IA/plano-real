import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/* Portão de URL (Next 16: middleware.ts virou proxy.ts).
   Só verifica a PRESENÇA do cookie de sessão — a validação real da
   sessão acontece nas pages/actions via exigirUsuario(). Não há o
   redirecionamento inverso (logado → /), senão um cookie expirado
   que ainda não foi apagado causaria loop / ↔ /login. */

const ROTAS_PUBLICAS = ["/login", "/cadastro"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessao = getSessionCookie(request);
  const publica = ROTAS_PUBLICAS.some(
    (rota) => pathname === rota || pathname.startsWith(`${rota}/`),
  );

  if (publica) return NextResponse.next();
  if (!sessao) return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|icons|sw.js|manifest.webmanifest|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)",
  ],
};
