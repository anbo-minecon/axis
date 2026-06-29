// app/api/dashboard/resultados/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// ── Helper: recalcula puntaje con curva ^1.5 ──────────────────────────────
// Para datos históricos donde puntajePreliminar quedó en 0 (era Int, se truncaba)
function recalcularPreliminar(aciertos: number, total: number): number {
  if (total <= 0 || aciertos <= 0) return 0;
  return Math.round(Math.pow(aciertos / total, 1.5) * 100);
}

function puntajeEfectivoFn(r: {
  estadoCalif: string;
  puntajeTRI: number | null;
  puntajePreliminar: number;
  puntaje: number;
  total: number;
}): number {
  if (r.estadoCalif === "OFICIAL" && r.puntajeTRI != null)
    return Math.round(Number(r.puntajeTRI));

  if (r.puntajePreliminar > 0)
    return Math.round(r.puntajePreliminar);

  if (r.puntaje > 0 && r.total > 0)
    return recalcularPreliminar(r.puntaje, r.total);

  return 0;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    // ── BUG FIX #7: solo se devuelven resultados OFICIALES ──
    // El cliente pidió que el estudiante no vea NADA de su resultado
    // (ni preliminar) hasta que el admin cierre el simulacro. Mientras
    // estadoCalif siga en "PRELIMINAR", el registro existe en la base
    // de datos pero esta lista simplemente no lo incluye.
    const resultados = await (db as any).resultadoSimulacro.findMany({
      where: {
        estudianteId: session.user.id,
        estadoCalif:  "OFICIAL",
      },
      include: {
        examen: {
          select: {
            id:        true,
            nombre:    true,
            materia:   true,
            tiempoMin: true,
            _count:    { select: { claves: true } },
          },
        },
      },
      orderBy: { completadoEn: "desc" },
    });

    const data = resultados.map((r: any) => {
      const puntajeEfectivo = puntajeEfectivoFn({
        estadoCalif:       r.estadoCalif       ?? "PRELIMINAR",
        puntajeTRI:        r.puntajeTRI        ?? null,
        puntajePreliminar: r.puntajePreliminar ?? 0,
        puntaje:           r.puntaje           ?? 0,
        total:             r.total             ?? 0,
      });

      return {
        id:                r.examenId,
        nombre:            r.examen.nombre,
        materia:           r.examen.materia,
        tiempoMin:         r.examen.tiempoMin,
        totalPreguntas:    r.examen._count.claves,
        puntaje:           r.puntaje           ?? 0,
        total:             r.total             ?? 0,
        puntajePreliminar: r.puntajePreliminar ?? 0,
        puntajeTRI:        r.puntajeTRI != null ? Math.round(Number(r.puntajeTRI)) : null,
        estadoCalif:       r.estadoCalif       ?? "PRELIMINAR",
        pct:               puntajeEfectivo,
        tiempoUsado:       r.tiempoUsado       ?? 0,
        completadoEn:      r.completadoEn,
      };
    });

    return NextResponse.json({ resultados: data });
  } catch (error) {
    console.error("[GET /api/dashboard/resultados]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// ── NUEVO: cuántos simulacros completó el estudiante que aún no se publican ──
// Útil si quieres mostrar en el dashboard algo como "Tienes 2 resultados
// pendientes de publicación" sin revelar ningún puntaje.
async function obtenerPendientesCount(estudianteId: string) {
  return (db as any).resultadoSimulacro.count({
    where: { estudianteId, estadoCalif: "PRELIMINAR" },
  });
}