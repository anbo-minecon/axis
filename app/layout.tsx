// app/layout.tsx
import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import { SessionProvider } from "@/components/shared/SessionProvider";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Axis Pre-ICFES | Prepárate para tu futuro",
  description:
    "La plataforma más completa para prepararte para las Pruebas de Estado ICFES en Colombia. Simulacros, estadísticas y recursos de estudio personalizados.",
  keywords: "ICFES, pre-icfes, simulacro, pruebas de estado, Colombia, preparación",
  icons: {
    icon: "/images/logo.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${syne.variable} ${dmSans.variable}`}>
      <body className="font-body antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}