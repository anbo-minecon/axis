// app/api/developer/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authenticateDeveloper } from "@/lib/developer-guard";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const usuario = await authenticateDeveloper();

    if (!usuario) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener estadísticas generales del sistema
    const usuariosTotales = await db.usuario.count();
    const usuariosActivos = await db.usuario.count({
      where: {
        suscripcion: {
          activa: true,
        },
      },
    });

    const por_rol = await db.usuario.groupBy({
      by: ["rol"],
      _count: true,
    });

    const simulacros_hoy = await db.simulacro.count({
      where: {
        fechaInicio: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    });

    // Obtener últimos logs
    const recentLogs = await db.systemLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const recentAudit = await db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { usuario: { select: { nombre: true, email: true } } },
    });

    // Obtener backups recientes
    const backups = await db.backupLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Obtener estado de integraciones
    const integraciones = await db.integrationLog.findMany({
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      dashboard: {
        timestamp: new Date(),
        sistema: {
          usuariosTotales,
          usuariosActivos,
          porRol: por_rol,
          simulacrosHoy: simulacros_hoy,
        },
        logs: {
          sistema: recentLogs,
          auditoria: recentAudit,
        },
        backups: backups,
        integraciones: integraciones,
      },
    });
  } catch (error) {
    console.error("Error en dashboard:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
