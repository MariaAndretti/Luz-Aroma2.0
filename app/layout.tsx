import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Painel Luz & Aroma",
  description: "Painel administrativo para gerenciar pedidos e produtos da Luz & Aroma",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
