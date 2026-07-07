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
    const usuarios = await (db as any).usuario.findMany({
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        planId: true,
        createdAt: true,
        developerCred: {
          select: {
            ultimoAcceso: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      usuarios: usuarios.map((u: any) => ({
        id: u.id,
        nombre: u.nombre,
        email: u.email,
        rol: u.rol,
        planId: u.planId,
        activo: true, // Por defecto activo si existe
        createdAt: u.createdAt.toISOString(),
        lastLogin: u.developerCred?.ultimoAcceso?.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[GET /api/developer/usuarios]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
