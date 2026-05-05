// app/api/dashboard/resultados/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const resultados = await db.resultadoSimulacro.findMany({
      where: { estudianteId: session.user.id },
      include: {
        examen: {
          select: {
            id: true,
            nombre: true,
            materia: true,
            tiempoMin: true,
            _count: { select: { claves: true } },
          },
        },
      },
      orderBy: { completadoEn: "desc" },
    });

    const data = resultados.map((r) => ({
      id: r.examenId,
      nombre: r.examen.nombre,
      materia: r.examen.materia,
      tiempoMin: r.examen.tiempoMin,
      totalPreguntas: r.examen._count.claves,
      puntaje: r.puntaje,
      total: r.total,
      pct: Math.round((r.puntaje / r.total) * 100),
      tiempoUsado: r.tiempoUsado,
      completadoEn: r.completadoEn,
    }));

    return NextResponse.json({ resultados: data });
  } catch (error) {
    console.error("[GET /api/dashboard/resultados]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}