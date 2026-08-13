import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  /* Origens autorizadas a carregar assets do dev server: túnel ngrok e
     acesso direto pela rede local. Só vale em `next dev`. */
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok.app",
    "*.ngrok.dev",
    "192.168.0.221",
  ],
  experimental: {
    /* Server actions atrás de proxy (ngrok): aceita o Origin do túnel. */
    serverActions: {
      allowedOrigins: [
        "*.ngrok-free.app",
        "*.ngrok.app",
        "*.ngrok.dev",
        "192.168.0.221:3000",
      ],
    },
  },
};

export default nextConfig;
