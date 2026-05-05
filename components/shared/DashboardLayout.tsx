// components/shared/DashboardLayout.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
  requiereSubscripcion?: boolean;
  ocultarMenuMobil?: boolean;
}

export function DashboardLayout({
  children,
  requiereSubscripcion = false,
  ocultarMenuMobil = false,
}: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Redirigir a login si no está autenticado
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-axis-azul border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar ocultarMenuMobil={ocultarMenuMobil} />

      {/* Contenido principal */}
      <main className="flex-1 ml-0 lg:ml-64 overflow-y-auto">
        <div className="pt-4 px-4 md:px-8">{children}</div>
      </main>
    </div>
  );
}
