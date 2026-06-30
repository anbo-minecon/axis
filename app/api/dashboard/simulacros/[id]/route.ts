// app/api/dashboard/simulacros/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET — datos del examen sin revelar respuestas correctas
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const examen = await (db as any).examenTemplate.findUnique({
      where: { id: params.id, estado: "PUBLICADO" },
      select: {
        id: true,
        nombre: true,
        materia: true,
        tiempoMin: true,
        tieneSesiones: true,
        _count: { select: { claves: true } },
        sesiones: {
          select: {
            id: true,
            numero: true,
            nombre: true,
            tiempoMin: true,
          },
          orderBy: { numero: "asc" },
        },
      },
    });

    if (!examen) {
      return NextResponse.json({ error: "Examen no encontrado" }, { status: 404 });
    }

    // Verificar si ya lo completó
    const resultado = await (db as any).resultadoSimulacro.findUnique({
      where: {
        estudianteId_examenId: {
          estudianteId: session.user.id,
          examenId: params.id,
        },
      },
    });

    // Calcular preguntas por sesión
    const sesionesConPreguntas = await Promise.all(
      examen.sesiones.map(async (s: any) => {
        const clavesSesion = await (db as any).claveExamen.count({
          where: { examenId: params.id, sesionId: s.id },
        });
        return {
          ...s,
          totalPreguntas: clavesSesion,
        };
      })
    );

    return NextResponse.json({
      examen: {
        id: examen.id,
        nombre: examen.nombre,
        materia: examen.materia,
        tiempoMin: examen.tiempoMin,
        totalPreguntas: examen._count.claves,
        tieneSesiones: examen.tieneSesiones,
        sesiones: sesionesConPreguntas,
      },
      yaCompletado: !!resultado,
    });
  } catch (error) {
    console.error("[GET /api/dashboard/simulacros/[id]]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}