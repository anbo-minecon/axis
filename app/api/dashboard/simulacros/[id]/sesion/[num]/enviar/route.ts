// app/api/dashboard/simulacros/[id]/sesion/[num]/enviar/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { calcularPuntajePreliminar } from "@/lib/tri-engine";

const ANSWER_VALUES_AD = ["A", "B", "C", "D"] as const;
const ANSWER_VALUES_AH = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;

const bodySchema = z.object({
  respuestas: z.record(z.string(), z.string()),
  tiempoUsado: z.number().int().nonnegative(),
});

function getAllowedAnswers(materia: string) {
  return materia === "Inglés" ? ANSWER_VALUES_AH : ANSWER_VALUES_AD;
}

function normalizeRespuestas(respuestas: Record<string, string>, materia: string) {
  const allowed = getAllowedAnswers(materia);
  const cleaned: Record<string, string> = {};

  for (const [key, value] of Object.entries(respuestas)) {
    const normalized = String(value).trim().toUpperCase();
    if (!allowed.includes(normalized as any)) {
      throw new Error("Respuestas inválidas");
    }
    cleaned[key] = normalized;
  }

  return cleaned;
}

export async function POST(
  req: Request,
  { params }: { params: { id: string; num: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const numSesion = parseInt(params.num, 10);
    if (isNaN(numSesion) || numSesion < 1)
      return NextResponse.json({ error: "Número de sesión inválido" }, { status: 400 });

    const body   = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

    const { respuestas: rawRespuestas, tiempoUsado } = parsed.data;

    // Obtener sesión con sus claves
    const sesion = await (db as any).sesionExamen.findFirst({
      where:   { examenId: params.id, numero: numSesion },
      include: { claves: { orderBy: { numeroPregunta: "asc" } } },
    });
    if (!sesion)
      return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });

    // Verificar estado del examen
    const examen = await (db as any).examenTemplate.findUnique({
      where:  { id: params.id },
      select: { estado: true, materia: true, tieneSesiones: true },
    });
    if (!examen || !["PUBLICADO", "CERRADO"].includes(examen.estado))
      return NextResponse.json({ error: "El simulacro no está disponible" }, { status: 403 });

    // Para grupal, validar más permisivamente (permitir A-H)
    // Para individual, validar según materia específica
    const validarRespuestas = examen.tieneSesiones 
      ? (respuestas: Record<string, string>) => {
          // Grupal: permitir A-H para cualquier pregunta
          const cleaned: Record<string, string> = {};
          for (const [key, value] of Object.entries(respuestas)) {
            const normalized = String(value).trim().toUpperCase();
            if (!ANSWER_VALUES_AH.includes(normalized as any)) {
              throw new Error("Respuestas inválidas");
            }
            cleaned[key] = normalized;
          }
          return cleaned;
        }
      : (respuestas: Record<string, string>) => normalizeRespuestas(respuestas, examen.materia);

    let respuestas: Record<string, string>;
    try {
      respuestas = validarRespuestas(rawRespuestas);
    } catch {
      return NextResponse.json({ error: "Respuestas inválidas" }, { status: 400 });
    }

    // Verificar si existe un borrador previo
    const existente = await (db as any).resultadoSesion.findUnique({
      where: {
        estudianteId_sesionId: {
          estudianteId: session.user.id,
          sesionId:     sesion.id,
        },
      },
      select: { id: true, esBorrador: true },
    });

    if (existente && !existente.esBorrador)
      return NextResponse.json({ error: "Ya respondiste esta sesión" }, { status: 409 });

    // Calcular aciertos
    let aciertos = 0;
    const detalles: Record<string, { dada: string | null; correcta: string; correcto: boolean }> = {};

    for (const clave of sesion.claves) {
      const num      = String(clave.numeroPregunta);
      const correcta = clave.respuesta;
      const dada     = respuestas[num] ?? null;
      const correcto = dada === correcta;
      if (correcto) aciertos++;
      detalles[num] = { dada, correcta, correcto };
    }

    // BUG FIX: total = claves reales de esta sesión, NO 100 hardcodeado
    const total             = sesion.claves.length;
    const puntajePreliminar = calcularPuntajePreliminar(aciertos, total);

    // Guardar resultado de sesión
    await (db as any).resultadoSesion.create({
      data: {
        estudianteId:     session.user.id,
        examenId:         params.id,
        sesionId:         sesion.id,
        respuestas,
        aciertos,
        total,            // ← total real de esta sesión
        puntajePreliminar,
        tiempoUsado,
      },
    });

    // ¿Completó TODAS las sesiones?
    const todasSesiones = await (db as any).sesionExamen.findMany({
      where:  { examenId: params.id },
      select: { id: true },
    });

    const resultadosExistentes = await (db as any).resultadoSesion.findMany({
      where:  { estudianteId: session.user.id, examenId: params.id },
      select: { aciertos: true, total: true, puntajePreliminar: true },
    });

    const completoTodo = resultadosExistentes.length === todasSesiones.length;

    if (completoTodo) {
      // BUG FIX: totalPreguntas = suma real de todas las sesiones, NO 100
      const totalAciertos  = resultadosExistentes.reduce(
        (a: number, r: any) => a + (r.aciertos ?? 0), 0
      );
      const totalPreguntas = resultadosExistentes.reduce(
        (a: number, r: any) => a + (r.total ?? 0), 0
      );
      // Promedio ponderado por preguntas de cada sesión
      const sumaPonderada  = resultadosExistentes.reduce(
        (a: number, r: any) => a + (r.puntajePreliminar ?? 0) * (r.total ?? 0), 0
      );
      const promedioGlobal = totalPreguntas > 0
        ? Number((sumaPonderada / totalPreguntas).toFixed(2))
        : 0;

      await (db as any).resultadoSimulacro.upsert({
        where: {
          estudianteId_examenId: {
            estudianteId: session.user.id,
            examenId:     params.id,
          },
        },
        create: {
          estudianteId:      session.user.id,
          examenId:          params.id,
          respuestas:        {},
          puntaje:           totalAciertos,
          puntajePreliminar: promedioGlobal,
          total:             totalPreguntas,  // ← total real
          tiempoUsado,
          estadoCalif:       "PRELIMINAR",
        },
        update: {
          puntaje:           totalAciertos,
          puntajePreliminar: promedioGlobal,
          total:             totalPreguntas,  // ← total real
          tiempoUsado,
          estadoCalif:       "PRELIMINAR",
        },
      });
    }

    return NextResponse.json({
      ok:                true,
      puntajePreliminar,
      correctas:         aciertos,
      total,
      detalles,
      completoSimulacro: completoTodo,
    }, { status: 201 });

  } catch (e: any) {
    if (e?.code === "P2002")
      return NextResponse.json({ error: "Ya respondiste esta sesión" }, { status: 409 });
    console.error("[POST sesion/enviar]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}