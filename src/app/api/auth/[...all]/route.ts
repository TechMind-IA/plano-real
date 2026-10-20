import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

/* Handlers do better-auth em /api/auth/* (sign-in, sign-up,
   get-session, sign-out, ...). */
export const { GET, POST } = toNextJsHandler(auth.handler);
