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
    const logs = await (db as any).auditLog.findMany({
      include: {
        usuario: {
          select: { nombre: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      logs: logs.map((log: any) => ({
        id: log.id,
        usuarioId: log.usuarioId,
        usuarioNombre: log.usuario?.nombre || log.usuario?.email,
        accion: log.accion,
        recurso: log.recurso,
        recursoId: log.recursoId,
        resultado: log.resultado,
        mensaje: log.mensaje,
        ip: log.ip,
        createdAt: log.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[GET /api/developer/auditorias]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
