// app/dashboard/layout.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { db } from "@/lib/db";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ── 1. Verificar autenticación ──
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // ── 2. Obtener grupo asignado (para mostrar alerta) ──
  // Si el modelo de usuario tiene grupoId, lo podemos leer directamente
  let grupoId: string | null = null;
  try {
    const usuario = await db.usuario.findUnique({
      where: { id: session.user.id },
      select: { grupoId: true },
    });
    grupoId = usuario?.grupoId ?? null;
  } catch {
    // Si el campo no existe en el schema, continuamos sin él
  }

  const user = {
    id: session.user.id,
    name: session.user.name ?? "Usuario",
    email: session.user.email ?? "",
    image: session.user.image ?? null,
    tieneSubscripcion: session.user.tieneSubscripcion ?? false,
    grupoId,
  };

  return <DashboardShell user={user}>{children}</DashboardShell>;
}