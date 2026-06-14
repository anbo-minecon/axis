// app/api/docente/material/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  titulo:      z.string().min(1).max(120).optional(),
  descripcion: z.string().max(500).optional().nullable(),
  tipo:        z.enum(["PDF", "VIDEO"]).optional(),
  url:         z.string().url("La URL no es válida").optional(),
  materia:     z.string().max(60).optional().nullable(),
  orden:       z.number().int().optional(),
  activo:      z.boolean().optional(),
});

async function verificarDocente(userId: string) {
  const u = await db.usuario.findUnique({
    where:  { id: userId },
    select: { rol: true },
  });
  return u?.rol === "DOCENTE" || u?.rol === "ADMIN";
}

// ── GET ───────────────────────────────────────────────────────────────────
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (!(await verificarDocente(session.user.id)))
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

    const material = await (db as any).material.findUnique({
      where:   { id: params.id },
      include: { creadoPor: { select: { nombre: true, rol: true } } },
    });

    if (!material)
      return NextResponse.json({ error: "Material no encontrado" }, { status: 404 });

    return NextResponse.json({ material });
  } catch (e) {
    console.error("[GET /api/docente/material/[id]]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// ── PUT — editar material ─────────────────────────────────────────────────
export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (!(await verificarDocente(session.user.id)))
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

    const material = await (db as any).material.findUnique({ where: { id: params.id } });
    if (!material)
      return NextResponse.json({ error: "Material no encontrado" }, { status: 404 });

    const body   = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Datos inválidos" },
        { status: 400 },
      );
    }

    const updated = await (db as any).material.update({
      where: { id: params.id },
      data:  parsed.data,
    });

    try {
      await db.auditLog.create({
        data: {
          usuarioId: session.user.id,
          accion:    "EDITAR_MATERIAL",
          recurso:   "material",
          recursoId: params.id,
          resultado: "EXITOSO",
          mensaje:   `Material "${material.titulo}" editado`,
        },
      });
    } catch { /* no bloquear */ }

    return NextResponse.json({ ok: true, material: updated });
  } catch (e) {
    console.error("[PUT /api/docente/material/[id]]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// ── PATCH — toggle activo/inactivo ────────────────────────────────────────
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (!(await verificarDocente(session.user.id)))
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

    const material = await (db as any).material.findUnique({ where: { id: params.id } });
    if (!material)
      return NextResponse.json({ error: "Material no encontrado" }, { status: 404 });

    const updated = await (db as any).material.update({
      where: { id: params.id },
      data:  { activo: !material.activo },
    });

    try {
      await db.auditLog.create({
        data: {
          usuarioId: session.user.id,
          accion:    "TOGGLE_MATERIAL",
          recurso:   "material",
          recursoId: params.id,
          resultado: "EXITOSO",
          mensaje:   `Material "${material.titulo}" ${updated.activo ? "activado" : "desactivado"}`,
        },
      });
    } catch { /* no bloquear */ }

    return NextResponse.json({ ok: true, material: updated });
  } catch (e) {
    console.error("[PATCH /api/docente/material/[id]]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// ── DELETE — eliminar material ────────────────────────────────────────────
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (!(await verificarDocente(session.user.id)))
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

    const material = await (db as any).material.findUnique({ where: { id: params.id } });
    if (!material)
      return NextResponse.json({ error: "Material no encontrado" }, { status: 404 });

    await (db as any).material.delete({ where: { id: params.id } });

    try {
      await db.auditLog.create({
        data: {
          usuarioId: session.user.id,
          accion:    "ELIMINAR_MATERIAL",
          recurso:   "material",
          recursoId: params.id,
          resultado: "EXITOSO",
          mensaje:   `Material "${material.titulo}" eliminado`,
        },
      });
    } catch { /* no bloquear */ }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE /api/docente/material/[id]]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}