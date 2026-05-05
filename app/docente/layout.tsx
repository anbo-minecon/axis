// app/docente/layout.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { DocenteShell } from "@/components/docente/DocenteShell";

export default async function DocenteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // ── 1. Autenticado ──
  if (!session?.user) redirect("/auth/login");

  // ── 2. Verificar rol DOCENTE en BD (no solo en JWT) ──
  const usuario = await db.usuario.findUnique({
    where: { id: session.user.id },
    select: { rol: true, nombre: true },
  });

  if (!usuario || usuario.rol !== "DOCENTE") {
    // Redirigir según su rol real
    if (usuario?.rol === "ADMIN") redirect("/admin/dashboard");
    if (usuario?.rol === "ESTUDIANTE") redirect("/dashboard");
    redirect("/auth/login");
  }

  // ── 3. Contar estudiantes sin grupo asignados a este docente ──
  // (por ahora cuenta globalmente; ajustar si el docente tiene grupos propios)
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
    id:    session.user.id,
    name:  session.user.name ?? usuario.nombre ?? "Docente",
    email: session.user.email ?? "",
    image: session.user.image ?? null,
  };

  return (
    <DocenteShell user={user} estudiantesSinGrupo={estudiantesSinGrupo}>
      {children}
    </DocenteShell>
  );
}