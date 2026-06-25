// app/admin/layout.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // ── 1. Autenticado ──
  if (!session?.user) {
    redirect("/auth/login");
  }

  // ── 2. Verificar rol ADMIN en BD (no solo en JWT) ──
  const usuario = await db.usuario.findUnique({
    where: { id: session.user.id },
    select: { rol: true, nombre: true },
  });

  if (!usuario || usuario.rol !== "ADMIN") {
    redirect("/dashboard");
  }

  // ── 3. Contar estudiantes sin grupo para la alerta ──
  let estudiantesSinGrupo = 0;
  try {
    estudiantesSinGrupo = await db.usuario.count({
      where: {
        rol: "ESTUDIANTE",
        grupoId: null,
        NOT: { suscripcion: null },
      },
    });
  } catch {
    // Campo grupoId puede no existir aún
  }

  const user = {
    id: session.user.id,
    name: session.user.name ?? usuario.nombre ?? "Admin",
    email: session.user.email ?? "",
    image: session.user.image ?? null,
  };

  return (
    <AdminShell user={user} estudiantesSinGrupo={estudiantesSinGrupo}>
      {children}
    </AdminShell>
  );
}