// app/api/dashboard/simulacros/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const now = new Date();

    // Todos los exámenes publicados
    const examenes = await (db as any).examenTemplate.findMany({
      where: { estado: "PUBLICADO" },
      include: {
        _count: { select: { claves: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Resultados del estudiante
    const resultados = await (db as any).resultadoSimulacro.findMany({
      where: { estudianteId: session.user.id },
      select: {
        examenId: true,
        puntaje: true,
        total: true,
        completadoEn: true,
      },
    });

    const resultadosMap = new Map(
      resultados.map((r: any) => [r.examenId, r])
    );

    const data = examenes.map((ex: any) => {
      const resultado = resultadosMap.get(ex.id) as any;
      const bloqueado = ex.fechaDisponible && new Date(ex.fechaDisponible) > now;

      return {
        id: ex.id,
        nombre: ex.nombre,
        materia: ex.materia,
        totalPreguntas: ex._count.claves,
        tiempoMin: ex.tiempoMin,
        fechaDisponible: ex.fechaDisponible ?? null,
        bloqueado: bloqueado ?? false,
        completado: !!resultado,
        resultado: resultado
          ? {
              puntaje: resultado.puntaje,
              total: resultado.total,
              completadoEn: resultado.completadoEn,
            }
          : null,
      };
    });

    return NextResponse.json({ examenes: data });
  } catch (error) {
    console.error("[GET /api/dashboard/simulacros]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}