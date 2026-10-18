import type { Metadata, Viewport } from "next";
import { Manrope, Sora } from "next/font/google";
import AvisoOffline from "@/components/AvisoOffline";
import RegistrarSW from "@/components/RegistrarSW";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-title",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Finanças",
  description: "Controle pessoal de custos fixos, variáveis e cartões",
  applicationName: "Finanças",
  appleWebApp: {
    capable: true,
    title: "Finanças",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#e9ecf2",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${sora.variable} ${manrope.variable}`}>
        <AvisoOffline />
        {children}
        <RegistrarSW />
      </body>
    </html>
  );
}
