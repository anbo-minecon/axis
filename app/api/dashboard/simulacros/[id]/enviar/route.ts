// app/api/dashboard/simulacros/[id]/enviar/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

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

function calcularPuntajePreliminar(aciertos: number, total: number) {
  if (total <= 0) return 0;
  return Number((Math.pow(aciertos / total, 1.5) * 100).toFixed(2));
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const { respuestas: rawRespuestas, tiempoUsado } = parsed.data;

    // Verificar que el examen existe
    const examen = await (db as any).examenTemplate.findUnique({
      where: { id: params.id, estado: "PUBLICADO" },
      include: { claves: { orderBy: { numeroPregunta: "asc" } } },
    });

    if (!examen) {
      return NextResponse.json({ error: "Examen no encontrado" }, { status: 404 });
    }

    let respuestas: Record<string, string>;
    try {
      respuestas = normalizeRespuestas(rawRespuestas, examen.materia);
    } catch {
      return NextResponse.json({ error: "Respuestas inválidas" }, { status: 400 });
    }

    // Verificar si ya completó el examen
    const existente = await (db as any).resultadoSimulacro.findUnique({
      where: {
        estudianteId_examenId: {
          estudianteId: session.user.id,
          examenId: params.id,
        },
      },
    });

    if (existente) {
      return NextResponse.json({ error: "Ya completaste este simulacro" }, { status: 409 });
    }

    const sesiones = await (db as any).sesionExamen.findMany({
      where: { examenId: params.id },
      orderBy: { numero: "asc" },
    });

    const clavesPorSesion = new Map<string, any[]>();
    examen.claves.forEach((clave: any) => {
      const sesionId = clave.sesionId ?? sesiones[0]?.id;
      if (!sesionId) return;
      const current = clavesPorSesion.get(sesionId) ?? [];
      current.push(clave);
      clavesPorSesion.set(sesionId, current);
    });

    if (clavesPorSesion.size === 0) {
      const fallbackSesion =
        sesiones[0] ||
        (await (db as any).sesionExamen.create({
          data: {
            examenId: params.id,
            numero: 1,
            nombre: "Sesión única",
            tiempoMin: examen.tiempoMin,
          },
        }));
      clavesPorSesion.set(fallbackSesion.id, examen.claves);
    }

    let totalCorrectas = 0;
    let totalPreguntas = 0;
    let acumuladoPreliminar = 0;
    const resumenSesiones: Array<any> = [];

    for (const [sesionId, claves] of clavesPorSesion.entries()) {
      const respuestasSesion: Record<string, string | null> = {};
      let aciertosSesion = 0;

      claves.forEach((clave) => {
        const actual = respuestas[String(clave.numeroPregunta)] ?? null;
        respuestasSesion[String(clave.numeroPregunta)] = actual;
        if (actual === clave.respuesta) aciertosSesion++;
      });

      const totalSesion = claves.length;
      const puntajePreliminar = calcularPuntajePreliminar(aciertosSesion, totalSesion);

      await (db as any).resultadoSesion.create({
        data: {
          estudianteId: session.user.id,
          examenId: params.id,
          sesionId,
          respuestas: respuestasSesion,
          aciertos: aciertosSesion,
          total: totalSesion,
          puntajePreliminar,
        },
      });

      totalCorrectas += aciertosSesion;
      totalPreguntas += totalSesion;
      acumuladoPreliminar += puntajePreliminar * totalSesion;

      resumenSesiones.push({
        sesionId,
        total: totalSesion,
        aciertos: aciertosSesion,
        puntajePreliminar,
      });
    }

    const puntajePreliminarGlobal = totalPreguntas
      ? Number((acumuladoPreliminar / totalPreguntas).toFixed(2))
      : 0;

    await (db as any).resultadoSimulacro.create({
      data: {
        estudianteId: session.user.id,
        examenId: params.id,
        respuestas,
        puntaje: totalCorrectas,
        total: totalPreguntas,
        puntajePreliminar: puntajePreliminarGlobal,
        tiempoUsado,
        estadoCalif: "PRELIMINAR",
      },
    });

    return NextResponse.json({
      ok: true,
      puntaje: totalCorrectas,
      total: totalPreguntas,
      puntajePreliminar: puntajePreliminarGlobal,
      porcentaje: totalPreguntas ? Math.round((totalCorrectas / totalPreguntas) * 100) : 0,
      sesiones: resumenSesiones,
    });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Ya completaste este simulacro" }, { status: 409 });
    }
    console.error("[POST /api/dashboard/simulacros/[id]/enviar]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}