// app/api/dashboard/resultados/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// ── Helper: recalcula puntaje con curva ^1.8 ──────────────────────────────
// Para datos históricos donde puntajePreliminar quedó en 0 (era Int, se truncaba)
function recalcularPreliminar(aciertos: number, total: number): number {
  if (total <= 0 || aciertos <= 0) return 0;
  return Math.round(Math.pow(aciertos / total, 1.8) * 100);
}

function puntajeEfectivoFn(r: {
  estadoCalif: string;
  puntajeTRI: number | null;
  puntajePreliminar: number;
  puntaje: number;   // aciertos crudos
  total: number;
}): number {
  // 1. TRI oficial si existe
  if (r.estadoCalif === "OFICIAL" && r.puntajeTRI != null)
    return Math.round(Number(r.puntajeTRI));

  // 2. Preliminar guardado si es > 0
  if (r.puntajePreliminar > 0)
    return Math.round(r.puntajePreliminar);

  // 3. BUG FIX: puntajePreliminar=0 con datos históricos (Int truncó decimales)
  // pero hay aciertos → recalcular con fórmula ^1.8
  if (r.puntaje > 0 && r.total > 0)
    return recalcularPreliminar(r.puntaje, r.total);

  return 0;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const resultados = await (db as any).resultadoSimulacro.findMany({
      where:   { estudianteId: session.user.id },
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
        puntaje:           r.puntaje           ?? 0,   // aciertos crudos
        total:             r.total             ?? 0,
        puntajePreliminar: r.puntajePreliminar ?? 0,
        puntajeTRI:        r.puntajeTRI != null ? Math.round(Number(r.puntajeTRI)) : null,
        estadoCalif:       r.estadoCalif       ?? "PRELIMINAR",
        pct:               puntajeEfectivo,             // porcentaje real 0-100
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