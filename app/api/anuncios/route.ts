// app/api/anuncios/route.ts  — pública, sin autenticación
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const anuncios = await (db as any).anuncio.findMany({
      where: { activo: true },
      orderBy: [{ orden: "asc" }, { creadoEn: "desc" }],
      select: {
        id: true,
        titulo: true,
        imagenUrl: true,
        linkUrl: true,
      },
    });

    return NextResponse.json({ anuncios });
  } catch (e) {
    console.error("[GET /api/anuncios]", e);
    return NextResponse.json({ anuncios: [] });
  }
}