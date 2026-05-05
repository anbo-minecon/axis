// app/api/dashboard/material/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const materiales = await (db as any).material.findMany({
      where: { activo: true },
      orderBy: [{ orden: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        tipo: true,
        url: true,
        materia: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ materiales });
  } catch (e) {
    console.error("[GET /api/dashboard/material]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}