import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateDeveloper } from "@/lib/developer-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const developer = await authenticateDeveloper();
  if (!developer) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const simulacros = await (db as any).examenTemplate.findMany({
      include: {
        _count: { select: { claves: true } },
        sesiones: {
          select: { id: true, numero: true, nombre: true, tiempoMin: true },
          orderBy: { numero: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      simulacros: simulacros.map((sim: any) => ({
        id: sim.id,
        nombre: sim.nombre,
        materia: sim.materia,
        totalPreguntas: sim.totalPreguntas,
        tiempoMin: sim.tiempoMin,
        estado: sim.estado,
        createdAt: sim.createdAt.toISOString(),
        updatedAt: sim.updatedAt.toISOString(),
        totalClaves: sim._count?.claves ?? 0,
        sesiones: sim.sesiones,
      })),
    });
  } catch (error) {
    console.error("[GET /api/developer/simulacros]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
