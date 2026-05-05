// app/dashboard/layout.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login");
  }

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