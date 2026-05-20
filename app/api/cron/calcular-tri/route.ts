// app/api/cron/calcular-tri/route.ts
//
// Esta ruta la llama un cron job automático (ej. Vercel Cron, cron-job.org)
// cada hora. Busca simulacros cuya fechaCierre ya pasó y calcula el TRI.
//
// En Vercel: agregar a vercel.json:
// {
//   "crons": [{ "path": "/api/cron/calcular-tri", "schedule": "0 * * * *" }]
// }
//
// La ruta está protegida por CRON_SECRET en las variables de entorno.
//
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calcularTRIGrupo } from "@/lib/tri-engine";

export async function GET(req: Request) {
  // Verificar secret del cron
  const auth   = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const ahora = new Date();

    // PASO 1: Buscar simulacros PUBLICADOS con fechaCierre pasada para CERRAR
    const examenesPorCerrar = await (db as any).examenTemplate.findMany({
      where: {
        estado:      "PUBLICADO",
        fechaCierre: { lte: ahora },
      },
    });

    let cerrados = 0;
    for (const examen of examenesPorCerrar) {
      try {
        await (db as any).examenTemplate.update({
          where: { id: examen.id },
          data:  { estado: "CERRADO" },
        });
        cerrados++;
      } catch (e) {
        console.error(`Error cerrando examen ${examen.id}:`, e);
      }
    }

    // PASO 2: Buscar simulacros CERRADOS con TRI sin calcular
    const examensPendientes = await (db as any).examenTemplate.findMany({
      where: {
        estado:       "CERRADO",
        triCalculado: false,
      },
      include: {
        sesiones: {
          include: {
            claves: { orderBy: { numeroPregunta: "asc" } },
          },
        },
        claves: { orderBy: { numeroPregunta: "asc" } },
      },
    });

    if (examensPendientes.length === 0) {
      return NextResponse.json({ 
        ok: true, 
        cerrados, 
        procesados: 0, 
        mensaje: "Nada que procesar" 
      });
    }

    let procesados = 0;

    for (const examen of examensPendientes) {
      try {
        await procesarTRIExamen(examen);
        procesados++;
      } catch (e) {
        console.error(`Error TRI examen ${examen.id}:`, e);
      }
    }

    return NextResponse.json({ 
      ok: true, 
      cerrados, 
      procesados,
      mensaje: `${cerrados} exámenes cerrados, ${procesados} con TRI calculado`
    });
  } catch (e) {
    console.error("[GET /api/cron/calcular-tri]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// ── También exponer como POST para llamadas manuales desde el admin ────────
export async function POST(req: Request) {
  try {
    const session_header = req.headers.get("x-admin-secret");
    if (session_header !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { examenId, cerrar } = await req.json();

    const examen = await (db as any).examenTemplate.findUnique({
      where: { id: examenId },
      include: {
        sesiones: { include: { claves: { orderBy: { numeroPregunta: "asc" } } } },
        claves:   { orderBy: { numeroPregunta: "asc" } },
      },
    });

    if (!examen) return NextResponse.json({ error: "Simulacro no encontrado" }, { status: 404 });

    // Si solicita cerrar explícitamente
    if (cerrar === true) {
      if (examen.estado !== "PUBLICADO") {
        return NextResponse.json({ error: "El simulacro debe estar PUBLICADO para cerrarlo" }, { status: 400 });
      }
      await (db as any).examenTemplate.update({
        where: { id: examen.id },
        data:  { estado: "CERRADO" },
      });
    }

    // Si ya está cerrado o lo acaba de cerrar, calcular TRI
    if (examen.triCalculado) return NextResponse.json({ error: "TRI ya calculado" }, { status: 400 });

    await procesarTRIExamen(examen);

    return NextResponse.json({ 
      ok: true, 
      mensaje: cerrar ? "Simulacro cerrado y TRI calculado" : "TRI calculado y resultados oficiales actualizados" 
    });
  } catch (e) {
    console.error("[POST /api/cron/calcular-tri]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// ── Lógica principal de cálculo TRI para un examen ────────────────────────
async function procesarTRIExamen(examen: any) {
  const tieneSesiones = examen.tieneSesiones && examen.sesiones.length > 0;

  if (tieneSesiones) {
    // ── Caso con sesiones: calcular TRI por sesión y combinar ──────────────
    for (const sesion of examen.sesiones) {
      // Obtener todos los resultados de esta sesión
      const resultadosSesion = await (db as any).resultadoSesion.findMany({
        where:  { sesionId: sesion.id },
        select: { estudianteId: true, respuestas: true },
      });

      if (resultadosSesion.length === 0) continue;

      // Construir mapa de claves para esta sesión
      const claves: Record<string, string> = {};
      for (const c of sesion.claves) {
        claves[String(c.numeroPregunta)] = c.respuesta;
      }

      // Calcular TRI del grupo
      const { pesos, resultados } = calcularTRIGrupo(resultadosSesion, claves);

      // Guardar pesos calculados
      if (pesos.length > 0) {
        await (db as any).pesoPregunta.createMany({
          data: pesos.map((p) => ({
            examenId:       examen.id,
            sesionId:       sesion.id,
            numeroPregunta: p.numeroPregunta,
            dificultad:     p.dificultad,
            discriminacion: p.discriminacion,
            pesoNormalizado: p.pesoNormalizado,
          })),
          skipDuplicates: true,
        });
      }

      // Actualizar puntaje TRI en cada ResultadoSesion
      for (const r of resultados) {
        await (db as any).resultadoSesion.updateMany({
          where: { estudianteId: r.estudianteId, sesionId: sesion.id },
          data:  { puntajeTRI: r.puntajeTRI },
        });
      }
    }

    // Actualizar ResultadoSimulacro global con promedio TRI de sesiones
    const todosResultadosSesion = await (db as any).resultadoSesion.findMany({
      where: { examenId: examen.id, puntajeTRI: { not: null } },
    });

    // Agrupar por estudiante
    const porEstudiante = new Map<string, number[]>();
    for (const r of todosResultadosSesion) {
      if (!porEstudiante.has(r.estudianteId)) porEstudiante.set(r.estudianteId, []);
      porEstudiante.get(r.estudianteId)!.push(r.puntajeTRI);
    }

    for (const [estudianteId, puntajes] of porEstudiante) {
      const promedioTRI = Math.round(puntajes.reduce((a, b) => a + b, 0) / puntajes.length);
      await (db as any).resultadoSimulacro.updateMany({
        where: { estudianteId, examenId: examen.id },
        data:  { puntajeTRI: promedioTRI, estadoCalif: "OFICIAL" },
      });
    }
  } else {
    // ── Caso sin sesiones: TRI sobre el examen completo ────────────────────
    const resultados = await db.resultadoSimulacro.findMany({
      where:  { examenId: examen.id },
      select: { estudianteId: true, respuestas: true },
    });

    if (resultados.length === 0) {
      await (db as any).examenTemplate.update({
        where: { id: examen.id },
        data:  { triCalculado: true },
      });
      return;
    }

    const claves: Record<string, string> = {};
    for (const c of examen.claves) {
      claves[String(c.numeroPregunta)] = c.respuesta;
    }

    const respuestasGrupo = resultados.map((r) => ({
      estudianteId: r.estudianteId,
      respuestas:   r.respuestas as Record<string, string>,
    }));

    const { pesos, resultados: tri } = calcularTRIGrupo(respuestasGrupo, claves);

    // Guardar pesos
    if (pesos.length > 0) {
      await (db as any).pesoPregunta.createMany({
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

    // Actualizar puntajes oficiales
    for (const r of tri) {
      await (db as any).resultadoSimulacro.updateMany({
        where: { estudianteId: r.estudianteId, examenId: examen.id },
        data:  { puntajeTRI: r.puntajeTRI, estadoCalif: "OFICIAL" },
      });
    }
  }

  // Marcar examen como calculado
  await (db as any).examenTemplate.update({
    where: { id: examen.id },
    data:  { triCalculado: true },
  });
}