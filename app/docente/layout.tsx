"use client";

import { ReactNode } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/shared/DashboardLayout";

interface Props {
  children: ReactNode;
}

export default function DocenteLayout({ children }: Props) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user?.rol !== "DOCENTE") {
    redirect("/auth/login");
  }

  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}
