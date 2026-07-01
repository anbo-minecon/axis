// app/dashboard/simulacro/[id]/page.tsx  (REEMPLAZA el existente)
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { SimulacroExamen } from "@/components/dashboard/SimulacroExamen";

export const metadata = { title: "Simulacro en curso | AXIS Pre-ICFES" };
export const dynamic  = "force-dynamic";

export default async function SimulacroPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  // Obtener examen sin revelar claves
  const examen = await (db as any).examenTemplate.findUnique({
    where: { id: params.id, estado: "PUBLICADO" },
    select: {
      id:            true,
      nombre:        true,
      materia:       true,
      tiempoMin:     true,
      tieneSesiones: true,
      fechaCierre:   true,
      _count:        { select: { claves: true } },
      sesiones: {
        orderBy: { numero: "asc" },
        select: {
          id:        true,
          numero:    true,
          nombre:    true,
          tiempoMin: true,
          _count:    { select: { claves: true } },
        },
      },
      claves: {
        select: {
          numeroPregunta: true,
          area:           true,
          sesionId:       true,
        },
        orderBy: { numeroPregunta: "asc" },
      },
    },
  });

  if (!examen) redirect("/dashboard/simulacros");

  // Verificar qué sesiones ya completó el estudiante
  if (examen.tieneSesiones && examen.sesiones.length > 0) {
    const sesionesCompletadas = await (db as any).resultadoSesion.findMany({
      where: {
        estudianteId: session.user.id,
        examenId:     params.id,
      },
      select: { sesionId: true },
    });

    const idsCompletadas = new Set(sesionesCompletadas.map((r: any) => r.sesionId));
    const todasCompletadas = examen.sesiones.every((s: any) => idsCompletadas.has(s.id));

    if (todasCompletadas) redirect("/dashboard/simulacros");
  } else {
    // Sin sesiones — verificar resultado global
    const resultado = await (db as any).resultadoSimulacro.findUnique({
      where: {
        estudianteId_examenId: {
          estudianteId: session.user.id,
          examenId:     params.id,
        },
      },
      select: { id: true },
    });
    if (resultado) redirect("/dashboard/simulacros");
  }

  // Construir objeto examen para el cliente
  const examenData = {
    id:            examen.id,
    nombre:        examen.nombre,
    materia:       examen.materia,
    tiempoMin:     examen.tiempoMin,
    totalPreguntas: examen._count.claves,
    tieneSesiones: examen.tieneSesiones ?? false,
    sesiones:      (examen.sesiones ?? []).map((s: any) => ({
      id:             s.id,
      numero:         s.numero,
      nombre:         s.nombre,
      tiempoMin:      s.tiempoMin,
      totalPreguntas: s._count.claves,
    })),
    // Agregar áreas de preguntas para determinar opciones dinámicas
    // Priorizar INGLES cuando hay múltiples áreas para la misma pregunta
    areasPorSesion: (examen.sesiones ?? []).reduce((acc: Record<string, Record<number, string>>, sesion: any) => {
      const clavesSesion = (examen.claves ?? []).filter((c: any) => c.sesionId === sesion.id);
      acc[sesion.id] = clavesSesion.reduce((innerAcc: Record<number, string>, c: any) => {
        const preguntaNum = c.numeroPregunta;
        const areaActual = c.area;
        
        // Si ya existe un área para esta pregunta, solo reemplazar si el nuevo es INGLES
        if (!innerAcc[preguntaNum] || areaActual === "INGLES") {
          innerAcc[preguntaNum] = areaActual;
        }
        return innerAcc;
      }, {});
      return acc;
    }, {}),
  };

  return <SimulacroExamen examen={examenData} />;
}