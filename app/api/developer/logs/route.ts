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
    const logs = await (db as any).systemLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      logs: logs.map((log: any) => ({
        id: log.id,
        nivel: log.nivel,
        componente: log.componente,
        mensaje: log.mensaje,
        detalles: log.detalles,
        createdAt: log.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[GET /api/developer/logs]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
