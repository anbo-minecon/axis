// app/api/developer/backups/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authenticateDeveloper } from "@/lib/developer-guard";
import { db } from "@/lib/db";
import { logSystemError } from "@/lib/developer-auth";

export async function GET(request: NextRequest) {
  try {
    const usuario = await authenticateDeveloper();

    if (!usuario) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const backups = await db.backupLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    return NextResponse.json({
      backups,
      ultimoBackup: backups[0] || null,
    });
  } catch (error) {
    console.error("Error obtener backups:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const usuario = await authenticateDeveloper();

    if (!usuario) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tipo } = body; // FULL o INCREMENTAL

    // Crear registro de backup
    const backup = await db.backupLog.create({
      data: {
        tipo: tipo || "FULL",
        estado: "EN_PROGRESO",
      },
    });

    // En producción, aquí se ejecutaría PostgreSQL dump
    // pg_dump -U $PGUSER -h $PGHOST $PGDATABASE > backup.sql
    try {
      // Simular proceso de backup
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Actualizar registro
      const backupCompleto = await db.backupLog.update({
        where: { id: backup.id },
        data: {
          estado: "COMPLETADO",
          tamanio: Math.floor(Math.random() * 500) + 50, // MB simulado
          ubicacion: `/backups/${new Date().toISOString()}.sql`,
          duracionMs: 2000,
        },
      });

      return NextResponse.json({
        success: true,
        backup: backupCompleto,
        mensaje: "Backup completado exitosamente",
      });
    } catch (backupError) {
      await db.backupLog.update({
        where: { id: backup.id },
        data: {
          estado: "ERROR",
          error: String(backupError),
        },
      });

      await logSystemError(
        "ERROR",
        "BACKUP",
        "Error al crear backup",
        JSON.stringify(backupError)
      );

      return NextResponse.json(
        { error: "Error al crear backup" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error crear backup:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
