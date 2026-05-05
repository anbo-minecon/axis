// app/api/developer/system-logs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authenticateDeveloper } from "@/lib/developer-guard";
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const usuario = await authenticateDeveloper();

    if (!usuario) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const nivel = searchParams.get("nivel");
    const componente = searchParams.get("componente");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "100");

    const where: any = {};
    if (nivel) where.nivel = nivel;
    if (componente) where.componente = componente;

    const logs = await db.systemLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await db.systemLog.count({ where });

    // Estadísticas
    const porNivel = await db.systemLog.groupBy({
      by: ["nivel"],
      _count: true,
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // últimas 24 horas
        },
      },
    });

    return NextResponse.json({
      logs,
      estadisticas: {
        porNivel,
        total,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error obtener system logs:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
