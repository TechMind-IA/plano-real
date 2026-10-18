import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Origens autorizadas a carregar assets do dev server: túnel ngrok e
     acesso direto pela rede local. Só vale em `next dev`. */
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok.app",
    "*.ngrok.dev",
    "192.168.0.221",
  ],
  experimental: {
    /* Detecção de offline + retry automático de navegações e Server
       Actions quando a conexão volta (hook next/offline). */
    useOffline: true,
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
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
