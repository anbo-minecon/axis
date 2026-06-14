// app/api/docente/simulacros/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

async function verificarDocente(userId: string) {
  const u = await db.usuario.findUnique({
    where:  { id: userId },
    select: { rol: true },
  });
  return u?.rol === "DOCENTE";
}

// ── GET: Listar todos los simulacros visibles para el docente ─────────────
// El docente ve PUBLICADOS y CERRADOS (no borradores ni archivados)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (!(await verificarDocente(session.user.id)))
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get("estado"); // opcional

    const where: any = {
      estado: estado
        ? estado
        : { in: ["PUBLICADO", "CERRADO"] },
    };

    const simulacros = await (db as any).examenTemplate.findMany({
      where,
      include: {
        _count:   { select: { claves: true, resultados: true } },
        sesiones: {
          select:  { id: true, numero: true, nombre: true, tiempoMin: true },
          orderBy: { numero: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ simulacros });
  } catch (e) {
    console.error("[GET /api/docente/simulacros]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}