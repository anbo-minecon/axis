// app/api/dashboard/simulacros/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// ── Helper recálculo puntaje histórico ────────────────────────────────────
// Cuando puntajePreliminar=0 pero hay aciertos, significa que el registro
// fue guardado cuando el campo era Int y se truncó (ej: 13.7 → 0).
// En ese caso recalculamos con la fórmula original ^1.8.
function recalcularPreliminar(aciertos: number, total: number): number {
  if (total <= 0 || aciertos <= 0) return 0;
  return Math.round(Math.pow(aciertos / total, 1.8) * 100);
}

function puntajeEfectivo(r: {
  estadoCalif:       string;
  puntajeTRI:        number | null;
  puntajePreliminar: number;
  puntaje:           number;
  total:             number;
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

    const estudianteId = session.user.id;
    const now          = new Date();

    // ── 1. Exámenes PUBLICADOS y CERRADOS ─────────────────────────────────
    const examenes = await (db as any).examenTemplate.findMany({
      where: {
        estado: { in: ["PUBLICADO", "CERRADO"] },
        OR: [
          { fechaDisponible: null },
          { fechaDisponible: { lte: now } },
        ],
      },
      include: {
        _count:   { select: { claves: true } },
        sesiones: {
          select:  { id: true, numero: true, nombre: true, tiempoMin: true },
          orderBy: { numero: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // ── 2. Resultados globales del estudiante ─────────────────────────────
    const resultadosGlobales = await (db as any).resultadoSimulacro.findMany({
      where: { estudianteId },
      select: {
        examenId:          true,
        puntaje:           true,
        total:             true,
        puntajePreliminar: true,
        puntajeTRI:        true,
        estadoCalif:       true,
        tiempoUsado:       true,
        completadoEn:      true,
      },
    });
    const mapGlobal = new Map(
      resultadosGlobales.map((r: any) => [r.examenId, r])
    );

    // ── 3. Sesiones completadas por el estudiante ─────────────────────────
    const resultadosSesion = await (db as any).resultadoSesion.findMany({
      where:  { estudianteId },
      select: { examenId: true, sesionId: true },
    });
    const sesionesCompletadas = new Set(
      resultadosSesion.map((r: any) => `${r.examenId}:${r.sesionId}`)
    );

    // ── 4. Construir respuesta ─────────────────────────────────────────────
    const data = examenes.map((ex: any) => {
      const rg = mapGlobal.get(ex.id) as any ?? null;

      // Detectar completado
      let completado = false;
      if (!ex.tieneSesiones || ex.sesiones.length === 0) {
        completado = !!rg;
      } else {
        completado = ex.sesiones.every((s: any) =>
          sesionesCompletadas.has(`${ex.id}:${s.id}`)
        );
      }

      const bloqueado = ex.fechaDisponible
        ? new Date(ex.fechaDisponible) > now
        : false;

      // Puntaje efectivo con recálculo si es necesario
      const efectivo = rg ? puntajeEfectivo({
        estadoCalif:       rg.estadoCalif       ?? "PRELIMINAR",
        puntajeTRI:        rg.puntajeTRI        ?? null,
        puntajePreliminar: rg.puntajePreliminar ?? 0,
        puntaje:           rg.puntaje           ?? 0,
        total:             rg.total             ?? 0,
      }) : 0;

      return {
        id:              ex.id,
        nombre:          ex.nombre,
        materia:         ex.materia,
        totalPreguntas:  ex._count.claves,
        tiempoMin:       ex.tiempoMin,
        tieneSesiones:   ex.tieneSesiones ?? false,
        sesiones:        ex.sesiones,
        estado:          ex.estado,
        fechaDisponible: ex.fechaDisponible ?? null,
        fechaCierre:     ex.fechaCierre    ?? null,
        bloqueado,
        completado,
        resultado: rg ? {
          puntaje:           rg.puntaje           ?? 0,
          total:             rg.total             ?? 0,
          puntajePreliminar: rg.puntajePreliminar ?? 0,
          puntajeTRI:        rg.puntajeTRI != null
            ? Math.round(Number(rg.puntajeTRI)) : null,
          estadoCalif:       rg.estadoCalif       ?? "PRELIMINAR",
          puntajeEfectivo:   efectivo,
          tiempoUsado:       rg.tiempoUsado       ?? 0,
          completadoEn:      rg.completadoEn,
        } : null,
      };
    });

    return NextResponse.json({ examenes: data });
  } catch (error) {
    console.error("[GET /api/dashboard/simulacros]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}