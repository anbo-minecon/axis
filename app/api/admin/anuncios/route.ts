// app/api/admin/anuncios/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// Validador flexible para URLs: acepta URLs absolutas (http/https) o relativas (/images/...)
const urlFlexible = z.string().refine(
  (url) => {
    // Aceptar URLs absolutas (http/https) o relativas (/...)
    return /^(https?:\/\/|\/)[^\s]+$/.test(url);
  },
  "La URL debe ser válida (http/https o /ruta/relativa)"
);

const anuncioSchema = z.object({
  titulo:    z.string().min(1, "El título es obligatorio").max(120),
  imagenUrl: urlFlexible,
  linkUrl:   urlFlexible.optional().nullable(),
  orden:     z.number().int().default(0),
});

async function verificarAdmin(userId: string) {
  const u = await db.usuario.findUnique({ where: { id: userId }, select: { rol: true } });
  return u?.rol === "ADMIN";
}

// ── GET — todos los anuncios (admin) ──────────────────────────────────────
export async function GET(_req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (!(await verificarAdmin(session.user.id))) return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

    const anuncios = await (db as any).anuncio.findMany({
      orderBy: [{ orden: "asc" }, { creadoEn: "desc" }],
    });

    return NextResponse.json({ anuncios });
  } catch (e) {
    console.error("[GET /api/admin/anuncios]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// ── POST — crear anuncio ──────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (!(await verificarAdmin(session.user.id))) return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

    const body   = await req.json();
    const parsed = anuncioSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Datos inválidos" }, { status: 400 });
    }

    const { titulo, imagenUrl, linkUrl, orden } = parsed.data;

    const anuncio = await (db as any).anuncio.create({
      data: {
        titulo,
        imagenUrl,
        linkUrl:    linkUrl ?? null,
        orden,
        activo:     true,
        creadoPorId: session.user.id,
      },
    });

    return NextResponse.json({ ok: true, anuncio }, { status: 201 });
  } catch (e) {
    console.error("[POST /api/admin/anuncios]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}