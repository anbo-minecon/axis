// app/dashboard/simulacro/[id]/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { SimulacroExamen } from "@/components/dashboard/SimulacroExamen";

export const metadata = { title: "Simulacro en curso | AXIS Pre-ICFES" };

export const dynamic = "force-dynamic";

export default async function SimulacroPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  // Obtener examen (sin claves de respuesta)
  const examen = await (db as any).examenTemplate.findUnique({
    where: { id: params.id, estado: "PUBLICADO" },
    select: {
      id: true,
      nombre: true,
      materia: true,
      tiempoMin: true,
      _count: { select: { claves: true } },
    },
  });

  if (!examen) redirect("/dashboard/simulacros");

  // Verificar si ya lo completó
  const resultado = await (db as any).resultadoSimulacro.findUnique({
    where: {
      estudianteId_examenId: {
        estudianteId: session.user.id,
        examenId: params.id,
      },
    },
    select: { id: true },
  });

  if (resultado) redirect(`/dashboard/simulacros`);

  const examenData = {
    id: examen.id,
    nombre: examen.nombre,
    materia: examen.materia,
    tiempoMin: examen.tiempoMin,
    totalPreguntas: examen._count.claves,
  };

  return <SimulacroExamen examen={examenData} />;
}