// app/layout.tsx
import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import { SessionProvider } from "@/components/shared/SessionProvider";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
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
    <html lang="es" className={`${syne.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <head>
        {/* Anti-FOUC: aplica el tema antes de pintar la página */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  const theme = localStorage.getItem("theme");
                  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                  const shouldBeDark = theme === "dark" || (!theme && prefersDark);
                  if (shouldBeDark) {
                    document.documentElement.classList.add("dark");
                  } else {
                    document.documentElement.classList.remove("dark");
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-body antialiased bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 transition-colors duration-300">
        {/*
          ThemeProvider va POR FUERA de SessionProvider
          para que tanto la landing como el dashboard
          tengan acceso al contexto de tema.
        */}
        <ThemeProvider>
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}