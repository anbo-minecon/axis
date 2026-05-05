// app/api/admin/material/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const materialSchema = z.object({
  titulo:      z.string().min(1, "El título es obligatorio").max(120),
  descripcion: z.string().max(500).optional().nullable(),
  tipo:        z.enum(["PDF", "VIDEO"]),
  url:         z.string().url("La URL no es válida"),
  materia:     z.string().max(60).optional().nullable(),
  orden:       z.number().int().default(0),
});

// ── Verificar admin ───────────────────────────────────────────────────────
async function verificarAdmin(userId: string) {
  const u = await db.usuario.findUnique({
    where: { id: userId },
    select: { rol: true },
  });
  return u?.rol === "ADMIN";
}

// ── GET — listar todos (admin ve activos e inactivos) ─────────────────────
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (!(await verificarAdmin(session.user.id))) return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

    const materiales = await (db as any).material.findMany({
      orderBy: [{ orden: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ materiales });
  } catch (e) {
    console.error("[GET /api/admin/material]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// ── POST — crear material ─────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (!(await verificarAdmin(session.user.id))) return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

    const body   = await req.json();
    const parsed = materialSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Datos inválidos" }, { status: 400 });
    }

    const { titulo, descripcion, tipo, url, materia, orden } = parsed.data;

    const material = await (db as any).material.create({
      data: {
        titulo,
        descripcion: descripcion ?? null,
        tipo,
        url,
        materia: materia ?? null,
        orden,
        gratis: true,
        activo: true,
        creadoPorId: session.user.id,
      },
    });

    return NextResponse.json({ ok: true, material }, { status: 201 });
  } catch (e) {
    console.error("[POST /api/admin/material]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}