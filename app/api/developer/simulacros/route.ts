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
        sesiones: {
          select: { id: true, numero: true, nombre: true, tiempoMin: true },
          orderBy: { numero: "asc" },
        },
        claves: {
          select: { id: true },
        },
        resultados: {
          select: { id: true },
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
        tipo: sim.tieneSesiones ? "GRUPAL" : "INDIVIDUAL",
        materiasCount: sim.tieneSesiones ? sim.sesiones.length : 1,
        participantes: sim.resultados?.length ?? 0,
        createdAt: sim.createdAt.toISOString(),
        updatedAt: sim.updatedAt.toISOString(),
        totalClaves: sim.claves?.length ?? 0,
        sesiones: sim.sesiones,
      })),
    });
  } catch (error) {
    console.error("[GET /api/developer/simulacros]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
