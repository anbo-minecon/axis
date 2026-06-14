// app/api/dashboard/resultados/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// ── Helper: recalcula puntaje preliminar con curva ^1.8 ──────────────────
// Necesario para datos históricos guardados cuando puntajePreliminar era Int
// y se truncaba a 0 (ej: 13.7 → 0)
function recalcularPreliminar(aciertos: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round(Math.pow(aciertos / total, 1.8) * 100);
}

// ── Helper: puntaje efectivo considerando si el prelim está en 0 pero hay aciertos ──
function puntajeEfectivoFn(
  estadoCalif: string,
  puntajeTRI: number | null,
  puntajePreliminar: number,
  aciertos: number,
  total: number,
): number {
  // 1. Si es oficial con TRI calculado, usar TRI
  if (estadoCalif === "OFICIAL" && puntajeTRI != null)
    return Math.round(Number(puntajeTRI));

  // 2. Si el preliminar es mayor que 0, usarlo directamente
  if (puntajePreliminar > 0)
    return Math.round(puntajePreliminar);

  // 3. BUG FIX: puntajePreliminar=0 pero hay aciertos → datos históricos con Int truncado
  // Recalcular usando la fórmula original
  if (aciertos > 0 && total > 0)
    return recalcularPreliminar(aciertos, total);

  return 0;
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    // ── 1. Resultado global ────────────────────────────────────────────────
    const resultado = await (db as any).resultadoSimulacro.findUnique({
      where: {
        estudianteId_examenId: {
          estudianteId: session.user.id,
          examenId:     params.id,
        },
      },
      include: {
        examen: {
          select: {
            id:            true,
            nombre:        true,
            materia:       true,
            tiempoMin:     true,
            tieneSesiones: true,
            sesiones: {
              orderBy: { numero: "asc" },
              select: {
                id:        true,
                numero:    true,
                nombre:    true,
                tiempoMin: true,
                claves: {
                  orderBy: { numeroPregunta: "asc" },
                  select:  { numeroPregunta: true, respuesta: true },
                },
              },
            },
            claves: {
              orderBy: { numeroPregunta: "asc" },
              select:  { numeroPregunta: true, respuesta: true, sesionId: true },
            },
          },
        },
      },
    });

    if (!resultado)
      return NextResponse.json({ error: "Resultado no encontrado" }, { status: 404 });

    // ── 2. Resultados por sesión ───────────────────────────────────────────
    const resultadosSesion = await (db as any).resultadoSesion.findMany({
      where:   { estudianteId: session.user.id, examenId: params.id },
      orderBy: { completadoEn: "asc" },
      select: {
        id:                true,
        sesionId:          true,
        respuestas:        true,
        aciertos:          true,
        total:             true,
        puntajePreliminar: true,
        puntajeTRI:        true,
        tiempoUsado:       true,
        completadoEn:      true,
        sesion: { select: { id: true, numero: true, nombre: true } },
      },
    });

    const tieneSesiones = resultado.examen.tieneSesiones && resultado.examen.sesiones.length > 0;

    // ── 3. Construir mapa unificado de respuestas ─────────────────────────
    // Para multi-sesión: respuestas están en ResultadoSesion
    // Para individual: respuestas están en ResultadoSimulacro
    let respuestasEstudiante: Record<string, string | null> = {};

    if (tieneSesiones) {
      for (const rs of resultadosSesion) {
        const resp = rs.respuestas as Record<string, string>;
        for (const [num, val] of Object.entries(resp)) {
          respuestasEstudiante[num] = val;
        }
      }
    } else {
      // BUG FIX: las respuestas individuales SÍ están en ResultadoSimulacro.respuestas
      // No están vacías — verificar y usar
      const respRaw = resultado.respuestas as Record<string, string> ?? {};
      respuestasEstudiante = respRaw;
    }

    // ── 4. Construir claves sin duplicados ────────────────────────────────
    const clavesMap = new Map<number, string>();

    if (tieneSesiones) {
      for (const sesion of resultado.examen.sesiones) {
        for (const clave of sesion.claves) {
          if (!clavesMap.has(clave.numeroPregunta))
            clavesMap.set(clave.numeroPregunta, clave.respuesta);
        }
      }
    } else {
      for (const clave of resultado.examen.claves) {
        if (!clavesMap.has(clave.numeroPregunta))
          clavesMap.set(clave.numeroPregunta, clave.respuesta);
      }
    }

    const clavesOrdenadas = Array.from(clavesMap.entries()).sort((a, b) => a[0] - b[0]);

    const preguntas = clavesOrdenadas.map(([num, correcta]) => {
      const dada     = respuestasEstudiante[String(num)] ?? null;
      const correcto = dada !== null && dada === correcta;
      return {
        numero:            num,
        respuestaCorrecta: correcta,
        respuestaDada:     dada,
        correcto,
        sinResponder:      dada === null,
      };
    });

    const totalCorrectas   = preguntas.filter((p) => p.correcto).length;
    const totalIncorrectas = preguntas.filter((p) => !p.correcto && !p.sinResponder).length;
    const sinResponder     = preguntas.filter((p) => p.sinResponder).length;

    // ── 5. Puntaje efectivo con recálculo si es necesario ─────────────────
    // BUG FIX: si puntajePreliminar=0 (datos históricos con Int truncado)
    // pero hay aciertos, recalcular con la fórmula original ^1.8
    const puntajePreliminarReal = tieneSesiones
      // Para multi-sesión: usar el promedio ponderado de las sesiones
      ? (() => {
          const totalPts  = resultadosSesion.reduce((a: number, r: any) => a + (r.total ?? 0), 0);
          const sumaPond  = resultadosSesion.reduce((a: number, r: any) => {
            const prelim = puntajeEfectivoFn(
              "PRELIMINAR",
              null,
              r.puntajePreliminar ?? 0,
              r.aciertos ?? 0,
              r.total ?? 0,
            );
            return a + prelim * (r.total ?? 0);
          }, 0);
          return totalPts > 0 ? Math.round(sumaPond / totalPts) : 0;
        })()
      // Para individual: usar el del ResultadoSimulacro o recalcular
      : puntajeEfectivoFn(
          "PRELIMINAR",
          null,
          resultado.puntajePreliminar ?? 0,
          totalCorrectas,          // usar los aciertos que acabamos de calcular
          resultado.total ?? clavesOrdenadas.length,
        );

    const pct = puntajeEfectivoFn(
      resultado.estadoCalif ?? "PRELIMINAR",
      resultado.puntajeTRI,
      puntajePreliminarReal,
      totalCorrectas,
      resultado.total ?? clavesOrdenadas.length,
    );

    // ── 6. Resumen por sesión ─────────────────────────────────────────────
    const resumenSesiones = tieneSesiones
      ? resultadosSesion.map((rs: any) => {
          const sesionInfo = resultado.examen.sesiones.find((s: any) => s.id === rs.sesionId);
          const pctSesion  = puntajeEfectivoFn(
            rs.estadoCalif ?? "PRELIMINAR",
            rs.puntajeTRI,
            rs.puntajePreliminar ?? 0,
            rs.aciertos ?? 0,
            rs.total ?? 0,
          );
          return {
            sesionId:          rs.sesionId,
            numero:            sesionInfo?.numero ?? rs.sesion?.numero,
            nombre:            sesionInfo?.nombre ?? rs.sesion?.nombre ?? `Sesión ${rs.sesion?.numero}`,
            aciertos:          rs.aciertos ?? 0,
            total:             rs.total ?? 0,
            puntajePreliminar: pctSesion,
            puntajeTRI:        rs.puntajeTRI != null ? Math.round(Number(rs.puntajeTRI)) : null,
            pct:               pctSesion,
            tiempoUsado:       rs.tiempoUsado ?? 0,
            completadoEn:      rs.completadoEn,
          };
        })
      : [];

    return NextResponse.json({
      examen: {
        id:            resultado.examen.id,
        nombre:        resultado.examen.nombre,
        materia:       resultado.examen.materia,
        tiempoMin:     resultado.examen.tiempoMin,
        tieneSesiones,
      },
      resumen: {
        puntaje:           resultado.puntaje ?? totalCorrectas,
        total:             resultado.total   ?? clavesOrdenadas.length,
        pct,
        puntajePreliminar: puntajePreliminarReal,
        puntajeTRI:        resultado.puntajeTRI != null
          ? Math.round(Number(resultado.puntajeTRI))
          : null,
        estadoCalif:       resultado.estadoCalif ?? "PRELIMINAR",
        tiempoUsado:       resultado.tiempoUsado ?? 0,
        completadoEn:      resultado.completadoEn,
        totalCorrectas,
        totalIncorrectas,
        sinResponder,
      },
      preguntas,
      sesiones: resumenSesiones,
    });
  } catch (error) {
    console.error("[GET /api/dashboard/resultados/[id]]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}