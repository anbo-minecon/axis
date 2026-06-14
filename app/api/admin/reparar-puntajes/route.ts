// app/api/admin/reparar-puntajes/route.ts
//
// Endpoint para reparar registros históricos donde puntajePreliminar=0
// debido a que el campo era Int y se truncaban los decimales.
// Solo accesible por ADMIN.
// Llamar una sola vez: POST /api/admin/reparar-puntajes
//
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

function calcularPreliminar(aciertos: number, total: number): number {
  if (total <= 0 || aciertos <= 0) return 0;
  return parseFloat((Math.pow(aciertos / total, 1.8) * 100).toFixed(2));
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const usuario = await db.usuario.findUnique({
      where: { id: session.user.id },
      select: { rol: true },
    });
    if (usuario?.rol !== "ADMIN")
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

    // ── 1. Reparar ResultadoSimulacro con puntajePreliminar=0 pero puntaje>0 ──
    const resultadosRotos = await (db as any).resultadoSimulacro.findMany({
      where: {
        puntajePreliminar: 0,
        puntaje:           { gt: 0 },
        total:             { gt: 0 },
        puntajeTRI:        null,  // no tocar los que ya tienen TRI
      },
      select: {
        id:      true,
        puntaje: true,
        total:   true,
      },
    });

    let reparadosSimulacro = 0;
    for (const r of resultadosRotos) {
      const nuevo = calcularPreliminar(r.puntaje, r.total);
      if (nuevo > 0) {
        await (db as any).resultadoSimulacro.update({
          where: { id: r.id },
          data:  { puntajePreliminar: nuevo },
        });
        reparadosSimulacro++;
      }
    }

    // ── 2. Reparar ResultadoSesion con puntajePreliminar=0 pero aciertos>0 ──
    const sesionesRotas = await (db as any).resultadoSesion.findMany({
      where: {
        puntajePreliminar: 0,
        aciertos:          { gt: 0 },
        total:             { gt: 0 },
      },
      select: {
        id:       true,
        aciertos: true,
        total:    true,
      },
    });

    let reparadosSesion = 0;
    for (const r of sesionesRotas) {
      const nuevo = calcularPreliminar(r.aciertos, r.total);
      if (nuevo > 0) {
        await (db as any).resultadoSesion.update({
          where: { id: r.id },
          data:  { puntajePreliminar: nuevo },
        });
        reparadosSesion++;
      }
    }

    // ── 3. Re-calcular ResultadoSimulacro global para los multi-sesión ──────
    // Los que tienen respuestas={} y puntajePreliminar guardado desde sesiones
    const multiSesionRotos = await (db as any).resultadoSimulacro.findMany({
      where: {
        puntajePreliminar: 0,
        puntaje:           0,   // multi-sesión guarda puntaje=aciertos_globales
        puntajeTRI:        null,
      },
      select: { id: true, examenId: true, estudianteId: true },
    });

    let reparadosMulti = 0;
    for (const rm of multiSesionRotos) {
      // Buscar ResultadoSesion del estudiante para este examen
      const sesiones = await (db as any).resultadoSesion.findMany({
        where: {
          estudianteId: rm.estudianteId,
          examenId:     rm.examenId,
        },
        select: { aciertos: true, total: true, puntajePreliminar: true },
      });
      if (!sesiones.length) continue;

      const totalAciertos  = sesiones.reduce((a: number, s: any) => a + (s.aciertos ?? 0), 0);
      const totalPreguntas = sesiones.reduce((a: number, s: any) => a + (s.total    ?? 0), 0);
      const sumaPond       = sesiones.reduce((a: number, s: any) => {
        const prelim = s.puntajePreliminar > 0
          ? s.puntajePreliminar
          : calcularPreliminar(s.aciertos ?? 0, s.total ?? 0);
        return a + prelim * (s.total ?? 0);
      }, 0);

      const promedioGlobal = totalPreguntas > 0
        ? parseFloat((sumaPond / totalPreguntas).toFixed(2))
        : 0;

      if (promedioGlobal > 0 || totalAciertos > 0) {
        await (db as any).resultadoSimulacro.update({
          where: { id: rm.id },
          data: {
            puntaje:           totalAciertos,
            total:             totalPreguntas,
            puntajePreliminar: promedioGlobal,
          },
        });
        reparadosMulti++;
      }
    }

    // ── 4. Audit log ─────────────────────────────────────────────────────
    await db.auditLog.create({
      data: {
        usuarioId: session.user.id,
        accion:    "REPARAR_PUNTAJES",
        recurso:   "resultados",
        resultado: "EXITOSO",
        mensaje:   `Reparados: ${reparadosSimulacro} simulacros individuales, ${reparadosSesion} sesiones, ${reparadosMulti} multi-sesión globales`,
      },
    });

    return NextResponse.json({
      ok: true,
      reparados: {
        simulacrosIndividuales: reparadosSimulacro,
        sesiones:               reparadosSesion,
        multiSesionGlobales:    reparadosMulti,
        total:                  reparadosSimulacro + reparadosSesion + reparadosMulti,
      },
      mensaje: "Puntajes reparados correctamente. Los cambios ya están en la base de datos.",
    });
  } catch (error: any) {
    console.error("[POST /api/admin/reparar-puntajes]", error);
    return NextResponse.json(
      { error: "Error interno", detalle: error?.message },
      { status: 500 }
    );
  }
}

// ── GET: ver cuántos registros necesitan reparación (sin modificar nada) ──
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const usuario = await db.usuario.findUnique({
      where: { id: session.user.id },
      select: { rol: true },
    });
    if (usuario?.rol !== "ADMIN")
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

    const [simulacrosRotos, sesionesRotas, multiRotos] = await Promise.all([
      (db as any).resultadoSimulacro.count({
        where: { puntajePreliminar: 0, puntaje: { gt: 0 }, total: { gt: 0 }, puntajeTRI: null },
      }),
      (db as any).resultadoSesion.count({
        where: { puntajePreliminar: 0, aciertos: { gt: 0 }, total: { gt: 0 } },
      }),
      (db as any).resultadoSimulacro.count({
        where: { puntajePreliminar: 0, puntaje: 0, puntajeTRI: null },
      }),
    ]);

    return NextResponse.json({
      necesitanReparacion: {
        simulacrosIndividuales: simulacrosRotos,
        sesiones:               sesionesRotas,
        multiSesionGlobales:    multiRotos,
        total:                  simulacrosRotos + sesionesRotas + multiRotos,
      },
      instruccion: "Llama POST /api/admin/reparar-puntajes para aplicar la reparación.",
    });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}