// app/api/cron/calcular-tri/route.ts
//
// Cron job automático — cada hora busca simulacros con fechaCierre pasada
// y calcula el TRI. También cierra el simulacro automáticamente.
//
// Vercel cron (vercel.json):
// { "crons": [{ "path": "/api/cron/calcular-tri", "schedule": "0 * * * *" }] }
//
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calcularTRIGrupo } from "@/lib/tri-engine";

// ── GET: llamado por el cron automático ───────────────────────────────────
export async function GET(req: Request) {
  const auth   = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const ahora = new Date();

    // BUG FIX #1: buscar en PUBLICADO Y CERRADO (el admin puede cerrar manualmente
    // antes de que corra el cron, por eso también incluimos CERRADO sin TRI calculado)
    const examensPendientes = await (db as any).examenTemplate.findMany({
      where: {
        estado:       { in: ["PUBLICADO", "CERRADO"] },
        triCalculado: false,
        fechaCierre:  { lte: ahora },
      },
      include: {
        sesiones: {
          include: { claves: { orderBy: { numeroPregunta: "asc" } } },
          orderBy: { numero: "asc" },
        },
        claves: { orderBy: { numeroPregunta: "asc" } },
      },
    });

    if (examensPendientes.length === 0) {
      return NextResponse.json({ ok: true, procesados: 0, mensaje: "Nada que procesar" });
    }

    let procesados = 0;
    const errores: string[] = [];

    for (const examen of examensPendientes) {
      try {
        await procesarTRIExamen(examen);

        // BUG FIX #1: cerrar automáticamente si aún está PUBLICADO y su fechaCierre pasó
        if (examen.estado === "PUBLICADO") {
          await (db as any).examenTemplate.update({
            where: { id: examen.id },
            data:  { estado: "CERRADO", triCalculado: true },
          });
        } else {
          await (db as any).examenTemplate.update({
            where: { id: examen.id },
            data:  { triCalculado: true },
          });
        }

        procesados++;
      } catch (e: any) {
        const msg = `Examen ${examen.id}: ${e?.message ?? "error desconocido"}`;
        errores.push(msg);
        console.error(`[cron TRI] ${msg}`);
      }
    }

    return NextResponse.json({ ok: true, procesados, errores });
  } catch (e) {
    console.error("[GET /api/cron/calcular-tri]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// ── POST: llamado manual desde el panel admin ─────────────────────────────
export async function POST(req: Request) {
  try {
    const adminSecret = req.headers.get("x-admin-secret");
    if (adminSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { examenId } = await req.json();

    const examen = await (db as any).examenTemplate.findUnique({
      where: { id: examenId },
      include: {
        sesiones: {
          include: { claves: { orderBy: { numeroPregunta: "asc" } } },
          orderBy: { numero: "asc" },
        },
        claves: { orderBy: { numeroPregunta: "asc" } },
      },
    });

    if (!examen) return NextResponse.json({ error: "Simulacro no encontrado" }, { status: 404 });
    if (examen.triCalculado) return NextResponse.json({ error: "TRI ya calculado para este simulacro" }, { status: 400 });

    await procesarTRIExamen(examen);

    // Cerrar si sigue publicado
    await (db as any).examenTemplate.update({
      where: { id: examenId },
      data:  {
        triCalculado: true,
        estado: examen.estado === "PUBLICADO" ? "CERRADO" : examen.estado,
      },
    });

    return NextResponse.json({ ok: true, mensaje: "TRI calculado y simulacro cerrado correctamente." });
  } catch (e: any) {
    console.error("[POST /api/cron/calcular-tri]", e);
    return NextResponse.json({ error: "Error interno", detalle: e?.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Lógica principal TRI
// BUG FIX #2: usa "aciertos" (campo real en DB) en vez de "correctas"
// BUG FIX #3: usa "pesosPregunta" (nombre correcto del modelo Prisma)
//             el código anterior usaba "pesoPregunta" (sin 's') → crash silencioso
// ─────────────────────────────────────────────────────────────────────────
async function procesarTRIExamen(examen: any) {
  const tieneSesiones = examen.tieneSesiones && examen.sesiones?.length > 0;

  if (tieneSesiones) {
    // ── Con sesiones ────────────────────────────────────────────────────
    for (const sesion of examen.sesiones) {
      const resultadosSesion = await (db as any).resultadoSesion.findMany({
        where:  { sesionId: sesion.id },
        // BUG FIX #2: seleccionar "aciertos" (el campo que realmente existe en DB)
        select: { estudianteId: true, respuestas: true, aciertos: true, total: true },
      });
      if (!resultadosSesion.length) continue;

      const claves: Record<string, string> = {};
      for (const c of sesion.claves) claves[String(c.numeroPregunta)] = c.respuesta;

      const { pesos, resultados } = calcularTRIGrupo(
        resultadosSesion.map((r: any) => ({
          estudianteId: r.estudianteId,
          respuestas:   r.respuestas as Record<string, string>,
        })),
        claves,
      );

      if (pesos.length > 0) {
        // BUG FIX #3: "pesosPregunta" con 's' — nombre real del modelo en schema.prisma
        await (db as any).pesosPregunta.createMany({
          data: pesos.map((p) => ({
            examenId:        examen.id,
            sesionId:        sesion.id,
            numeroPregunta:  p.numeroPregunta,
            dificultad:      p.dificultad,
            discriminacion:  p.discriminacion,
            pesoNormalizado: p.pesoNormalizado,
          })),
          skipDuplicates: true,
        });
      }

      for (const r of resultados) {
        await (db as any).resultadoSesion.updateMany({
          where: { estudianteId: r.estudianteId, sesionId: sesion.id },
          data:  { puntajeTRI: r.puntajeTRI },
        });
      }
    }

    // Consolidar TRI global (promedio ponderado por total de preguntas de cada sesión)
    const todosRS = await (db as any).resultadoSesion.findMany({
      where:  { examenId: examen.id, puntajeTRI: { not: null } },
      select: { estudianteId: true, puntajeTRI: true, total: true },
    });

    const porEstudiante = new Map<string, { sumPonderada: number; totalPreguntas: number }>();
    for (const r of todosRS) {
      const prev = porEstudiante.get(r.estudianteId) ?? { sumPonderada: 0, totalPreguntas: 0 };
      porEstudiante.set(r.estudianteId, {
        sumPonderada:   prev.sumPonderada   + (r.puntajeTRI * r.total),
        totalPreguntas: prev.totalPreguntas + r.total,
      });
    }

    for (const [estudianteId, { sumPonderada, totalPreguntas }] of porEstudiante) {
      const triGlobal = totalPreguntas > 0
        ? Number((sumPonderada / totalPreguntas).toFixed(2))
        : 0;
      await (db as any).resultadoSimulacro.updateMany({
        where: { estudianteId, examenId: examen.id },
        data:  { puntajeTRI: triGlobal, estadoCalif: "OFICIAL" },
      });
    }

  } else {
    // ── Sin sesiones ────────────────────────────────────────────────────
    const resultados = await (db as any).resultadoSimulacro.findMany({
      where:  { examenId: examen.id },
      select: { estudianteId: true, respuestas: true },
    });

    if (!resultados.length) return; // sin participantes, no hay TRI que calcular

    const claves: Record<string, string> = {};
    for (const c of examen.claves) claves[String(c.numeroPregunta)] = c.respuesta;

    const { pesos, resultados: tri } = calcularTRIGrupo(
      resultados.map((r: any) => ({
        estudianteId: r.estudianteId,
        respuestas:   r.respuestas as Record<string, string>,
      })),
      claves,
    );

    if (pesos.length > 0) {
      // BUG FIX #3: "pesosPregunta" con 's'
      await (db as any).pesosPregunta.createMany({
        data: pesos.map((p) => ({
          examenId:        examen.id,
          numeroPregunta:  p.numeroPregunta,
          dificultad:      p.dificultad,
          discriminacion:  p.discriminacion,
          pesoNormalizado: p.pesoNormalizado,
        })),
        skipDuplicates: true,
      });
    }

    for (const r of tri) {
      await (db as any).resultadoSimulacro.updateMany({
        where: { estudianteId: r.estudianteId, examenId: examen.id },
        data:  { puntajeTRI: r.puntajeTRI, estadoCalif: "OFICIAL" },
      });
    }
  }
  // Nota: triCalculado y estado se actualizan en el llamador (GET/POST)
  // para separar la lógica de cálculo del cambio de estado.
}