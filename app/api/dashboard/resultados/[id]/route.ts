// app/api/dashboard/resultados/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtener resultado del estudiante
    const resultado = await db.resultadoSimulacro.findUnique({
      where: {
        estudianteId_examenId: {
          estudianteId: session.user.id,
          examenId: params.id,
        },
      },
      include: {
        examen: {
          select: {
            id: true,
            nombre: true,
            materia: true,
            tiempoMin: true,
            claves: {
              orderBy: { numeroPregunta: "asc" },
              select: { numeroPregunta: true, respuesta: true },
            },
          },
        },
      },
    });

    if (!resultado) {
      return NextResponse.json({ error: "Resultado no encontrado" }, { status: 404 });
    }

    const respuestasEstudiante = resultado.respuestas as Record<string, string>;

    // Construir desglose pregunta por pregunta
    const preguntas = resultado.examen.claves.map((clave) => {
      const num     = clave.numeroPregunta;
      const correcta = clave.respuesta;
      const dada     = respuestasEstudiante[String(num)] ?? null;
      const correcto = dada === correcta;

      return {
        numero: num,
        respuestaCorrecta: correcta,
        respuestaDada: dada,
        correcto,
      };
    });

    const totalCorrectas   = preguntas.filter((p) => p.correcto).length;
    const totalIncorrectas = preguntas.filter((p) => !p.correcto && p.respuestaDada !== null).length;
    const sinResponder     = preguntas.filter((p) => p.respuestaDada === null).length;
    const pct              = Math.round((resultado.puntaje / resultado.total) * 100);

    return NextResponse.json({
      examen: {
        id: resultado.examen.id,
        nombre: resultado.examen.nombre,
        materia: resultado.examen.materia,
        tiempoMin: resultado.examen.tiempoMin,
      },
      resumen: {
        puntaje: resultado.puntaje,
        total: resultado.total,
        pct,
        tiempoUsado: resultado.tiempoUsado,
        completadoEn: resultado.completadoEn,
        totalCorrectas,
        totalIncorrectas,
        sinResponder,
      },
      preguntas,
    });
  } catch (error) {
    console.error("[GET /api/dashboard/resultados/[id]]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}