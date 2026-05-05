// app/api/developer/audit-logs/route.ts
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
    const accion = searchParams.get("accion");
    const recurso = searchParams.get("recurso");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};
    if (accion) where.accion = accion;
    if (recurso) where.recurso = recurso;

    const logs = await db.auditLog.findMany({
      where,
      include: {
        usuario: {
          select: { nombre: true, email: true, rol: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await db.auditLog.count({ where });

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error obtener audit logs:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
