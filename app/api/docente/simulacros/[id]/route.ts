// app/api/docente/simulacros/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// ── Helpers ────────────────────────────────────────────────────────────────
function parseFecha(valor: string | null | undefined): Date | null {
  if (!valor) return null;
  const t = valor.trim();
  const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(t) ? `${t}:00.000Z` : t;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

async function verificarDocente(userId: string) {
  const u = await db.usuario.findUnique({
    where:  { id: userId },
    select: { rol: true },
  });
  return u?.rol === "DOCENTE";
}

async function auditLog(
  userId: string,
  examenId: string,
  nombre: string,
  accion: string,
  mensaje: string,
) {
  try {
    await db.auditLog.create({
      data: {
        usuarioId: userId,
        accion,
        recurso:   "examen_template",
        recursoId: examenId,
        resultado: "EXITOSO",
        mensaje:   `[DOCENTE] "${nombre}": ${mensaje}`,
      },
    });
  } catch { /* no bloquear */ }
}

// ── Schema edición — el docente NO puede cambiar estado ni claves ─────────
const editSchema = z.object({
  nombre:          z.string().min(1).max(120).optional(),
  tiempoMin:       z.number().int().positive().optional(),
  fechaDisponible: z.string().optional().nullable(),
  fechaCierre:     z.string().optional().nullable(),
});

// ── GET: detalle de un simulacro ──────────────────────────────────────────
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

    const examen = await (db as any).examenTemplate.findUnique({
      where:   { id: params.id },
      include: {
        _count:   { select: { claves: true, resultados: true } },
        sesiones: { orderBy: { numero: "asc" } },
      },
    });

    if (!examen)
      return NextResponse.json({ error: "Simulacro no encontrado" }, { status: 404 });

    // El docente solo puede ver PUBLICADOS y CERRADOS
    if (!["PUBLICADO", "CERRADO"].includes(examen.estado))
      return NextResponse.json({ error: "Sin acceso a este simulacro" }, { status: 403 });

    return NextResponse.json({ examen });
  } catch (e) {
    console.error("[GET /api/docente/simulacros/[id]]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// ── PUT: editar datos básicos (nombre, tiempos, fechas) ───────────────────
// El docente NO puede cambiar estado, materia ni claves
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

    const examen = await (db as any).examenTemplate.findUnique({
      where: { id: params.id },
    });
    if (!examen)
      return NextResponse.json({ error: "Simulacro no encontrado" }, { status: 404 });

    if (!["PUBLICADO", "CERRADO"].includes(examen.estado))
      return NextResponse.json({ error: "Sin acceso a este simulacro" }, { status: 403 });

    const body   = await req.json();
    const parsed = editSchema.safeParse(body);
    if (!parsed.success) {
      const msgs = parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
      return NextResponse.json({ error: msgs[0], detalles: msgs }, { status: 400 });
    }

    const { nombre, tiempoMin, fechaDisponible: fdRaw, fechaCierre: fcRaw } = parsed.data;

    const updateData: any = {};
    if (nombre    !== undefined) updateData.nombre    = nombre;
    if (tiempoMin !== undefined) updateData.tiempoMin = tiempoMin;
    if (fdRaw     !== undefined) updateData.fechaDisponible = parseFecha(fdRaw);
    if (fcRaw     !== undefined) updateData.fechaCierre     = parseFecha(fcRaw);

    const updated = await (db as any).examenTemplate.update({
      where: { id: params.id },
      data:  updateData,
    });

    await auditLog(
      session.user.id, params.id, examen.nombre,
      "EDITAR_SIMULACRO_DOCENTE",
      `Campos editados: ${Object.keys(updateData).join(", ")}`,
    );

    return NextResponse.json({ ok: true, examen: updated });
  } catch (e: any) {
    console.error("[PUT /api/docente/simulacros/[id]]", e);
    return NextResponse.json({ error: "Error interno", detalle: e?.message }, { status: 500 });
  }
}

// ── PATCH: solo CERRAR el simulacro ──────────────────────────────────────
// El docente puede cerrar (PUBLICADO → CERRADO) pero NO publicar, archivar ni eliminar
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

    const body = await req.json();
    const { estado } = body;

    // El docente SOLO puede cerrar — no puede publicar, archivar ni borrar
    if (estado !== "CERRADO")
      return NextResponse.json(
        { error: "Los docentes solo pueden cerrar simulacros, no cambiar a otros estados." },
        { status: 403 },
      );

    const examen = await (db as any).examenTemplate.findUnique({
      where: { id: params.id },
    });
    if (!examen)
      return NextResponse.json({ error: "Simulacro no encontrado" }, { status: 404 });

    if (examen.estado !== "PUBLICADO")
      return NextResponse.json(
        { error: "Solo se pueden cerrar simulacros que estén publicados." },
        { status: 400 },
      );

    const updated = await (db as any).examenTemplate.update({
      where: { id: params.id },
      data:  { estado: "CERRADO" },
    });

    await auditLog(
      session.user.id, params.id, examen.nombre,
      "CERRAR_SIMULACRO_DOCENTE",
      "Simulacro cerrado por el docente",
    );

    return NextResponse.json({ ok: true, examen: updated });
  } catch (e: any) {
    console.error("[PATCH /api/docente/simulacros/[id]]", e);
    return NextResponse.json({ error: "Error interno", detalle: e?.message }, { status: 500 });
  }
}