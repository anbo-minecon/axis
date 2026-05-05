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
        _count: { select: { claves: true } },
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

    return NextResponse.json({
      examen: {
        id: examen.id,
        nombre: examen.nombre,
        materia: examen.materia,
        tiempoMin: examen.tiempoMin,
        totalPreguntas: examen._count.claves,
      },
      yaCompletado: !!resultado,
    });
  } catch (error) {
    console.error("[GET /api/dashboard/simulacros/[id]]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}