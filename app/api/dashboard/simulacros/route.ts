// app/api/dashboard/simulacros/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const estudianteId = session.user.id;
    const now          = new Date();

    // ── 1. Traer todos los exámenes PUBLICADOS ─────────────────────────────
    const examenes = await (db as any).examenTemplate.findMany({
      where: {
        estado: "PUBLICADO",
        // ✅ Validar fechaDisponible: no empezar antes de esta fecha
        OR: [
          { fechaDisponible: null },
          { fechaDisponible: { lte: now } },
        ],
        // ✅ Validar fechaCierre: no mostrar si ya pasó la fecha de cierre
        AND: [
          {
            OR: [
              { fechaCierre: null },
              { fechaCierre: { gte: now } }, // Solo si el cierre es futuro (o hoy)
            ],
          },
        ],
      },
      include: {
        _count:   { select: { claves: true } },
        sesiones: {
          select: { id: true, numero: true, nombre: true, tiempoMin: true },
          orderBy: { numero: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // ── 2. Resultados globales del estudiante (ResultadoSimulacro) ─────────
    const resultadosGlobales = await (db as any).resultadoSimulacro.findMany({
      where: { estudianteId },
      select: {
        examenId:       true,
        puntaje:        true,
        total:          true,
        puntajeTRI:     true,
        estadoCalif:    true,
        tiempoUsado:    true,
        completadoEn:   true,
      },
    });
    const mapGlobal = new Map(
      resultadosGlobales.map((r: any) => [r.examenId, r])
    );

    // ── 3. Resultados por sesión del estudiante (para detectar sesiones completadas) ──
    const resultadosSesion = await (db as any).resultadoSesion.findMany({
      where: { estudianteId },
      select: {
        examenId: true,
        sesionId: true,
      },
    });
    // Set de "examenId:sesionId" completados
    const sesionesCompletadas = new Set(
      resultadosSesion.map((r: any) => `${r.examenId}:${r.sesionId}`)
    );

    // ── 4. Construir respuesta ─────────────────────────────────────────────
    const data = examenes.map((ex: any) => {
      const resultadoGlobal = mapGlobal.get(ex.id) as any ?? null;

      // Determinar si completó:
      // - Sin sesiones: existe ResultadoSimulacro
      // - Con sesiones: completó TODAS las sesiones (ResultadoSesion por cada sesionId)
      let completado = false;

      if (!ex.tieneSesiones || ex.sesiones.length === 0) {
        // Examen individual: basta con tener ResultadoSimulacro
        completado = !!resultadoGlobal;
      } else {
        // Examen grupal: verificar que todas las sesiones estén en resultadosSesion
        completado = ex.sesiones.every((s: any) =>
          sesionesCompletadas.has(`${ex.id}:${s.id}`)
        );
      }

      // Bloqueado: tiene fechaDisponible futura (doble-check aunque ya filtramos arriba)
      const bloqueado = ex.fechaDisponible
        ? new Date(ex.fechaDisponible) > now
        : false;

      return {
        id:              ex.id,
        nombre:          ex.nombre,
        materia:         ex.materia,
        totalPreguntas:  ex._count.claves,
        tiempoMin:       ex.tiempoMin,
        tieneSesiones:   ex.tieneSesiones ?? false,
        sesiones:        ex.sesiones,
        fechaDisponible: ex.fechaDisponible ?? null,
        fechaCierre:     ex.fechaCierre    ?? null,
        bloqueado,
        completado,
        resultado: resultadoGlobal
          ? {
              puntaje:      resultadoGlobal.puntaje,
              total:        resultadoGlobal.total,
              puntajeTRI:   resultadoGlobal.puntajeTRI   ?? null,
              estadoCalif:  resultadoGlobal.estadoCalif  ?? "PRELIMINAR",
              tiempoUsado:  resultadoGlobal.tiempoUsado  ?? 0,
              completadoEn: resultadoGlobal.completadoEn,
            }
          : null,
      };
    });

    return NextResponse.json({ examenes: data });
  } catch (error) {
    console.error("[GET /api/dashboard/simulacros]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}