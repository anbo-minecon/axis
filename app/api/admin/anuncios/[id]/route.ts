// app/api/admin/anuncios/[id]/route.ts
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

const updateSchema = z.object({
  titulo:    z.string().min(1).max(120).optional(),
  imagenUrl: urlFlexible.optional(),
  linkUrl:   urlFlexible.nullable().optional(),
  orden:     z.number().int().optional(),
  activo:    z.boolean().optional(),
});

async function verificarAdmin(userId: string) {
  const u = await db.usuario.findUnique({ where: { id: userId }, select: { rol: true } });
  return u?.rol === "ADMIN";
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (!(await verificarAdmin(session.user.id))) return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

    const body   = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Datos inválidos" }, { status: 400 });
    }

    const anuncio = await (db as any).anuncio.update({
      where: { id: params.id },
      data: parsed.data,
    });

    return NextResponse.json({ ok: true, anuncio });
  } catch (e) {
    console.error("[PUT /api/admin/anuncios/[id]]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (!(await verificarAdmin(session.user.id))) return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

    await (db as any).anuncio.delete({ where: { id: params.id } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE /api/admin/anuncios/[id]]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}