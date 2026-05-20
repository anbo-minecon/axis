import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// ── Helpers ────────────────────────────────────────────────────────────────
function parseFecha(valor: string | null | undefined): Date | null {
  if (!valor) return null;
  const trimmed = valor.trim();
  if (!trimmed) return null;
  const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)
    ? `${trimmed}:00.000Z`
    : trimmed;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

async function verificarAdmin(userId: string) {
  const u = await db.usuario.findUnique({ where: { id: userId }, select: { rol: true } });
  return u?.rol === "ADMIN";
}

// ── Schemas ────────────────────────────────────────────────────────────────
const updateSchema = z.object({
  nombre:          z.string().min(1, "El nombre es obligatorio").max(120).optional(),
  materia:         z.string().min(1).optional(),
  totalPreguntas:  z.number().int().positive().optional(),
  tiempoMin:       z.number().int().positive().optional(),
  estado:          z.enum(["BORRADOR", "PUBLICADO", "CERRADO", "ARCHIVADO"]).optional(),
  fechaDisponible: z.string().optional().nullable(),
  fechaCierre:     z.string().optional().nullable(),
  // Claves opcionales para actualización completa
  claves: z.array(z.object({
    numeroPregunta: z.number().int().positive(),
    respuesta:      z.enum(["A", "B", "C", "D"]),
    sesionNumero:   z.union([z.literal(1), z.literal(2)]).optional(),
  })).optional(),
});

// ─────────────────────────────────────────────────────────────────────────
// GET — detalle de un simulacro
// ─────────────────────────────────────────────────────────────────────────
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (!(await verificarAdmin(session.user.id)))
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

    const examen = await (db as any).examenTemplate.findUnique({
      where: { id: params.id },
      include: {
        claves:          { orderBy: { numeroPregunta: "asc" } },
        sesiones:        { orderBy: { numero: "asc" } },
        resultados:      true,
        pesos:           true,
      },
    });

    if (!examen)
      return NextResponse.json({ error: "Simulacro no encontrado" }, { status: 404 });

    return NextResponse.json({ examen });
  } catch (e) {
    console.error("[GET /api/admin/simulacros/[id]]", e);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────
// PATCH — solo cambiar estado (Publicar, Cerrar, Archivar, Borrador)
// ─────────────────────────────────────────────────────────────────────────

// Transiciones de estado permitidas
const TRANSICIONES_VALIDAS: Record<string, string[]> = {
  "BORRADOR":  ["PUBLICADO", "ARCHIVADO"],
  "PUBLICADO": ["CERRADO", "BORRADOR", "ARCHIVADO"],
  "CERRADO":   ["ARCHIVADO"], // ⚠️ NO puede retroceder a PUBLICADO
  "ARCHIVADO": ["BORRADOR"],
};

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (!(await verificarAdmin(session.user.id)))
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

    const body = await req.json();
    const { estado } = body;

    if (!estado || !["BORRADOR", "PUBLICADO", "CERRADO", "ARCHIVADO"].includes(estado))
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });

    const examen = await (db as any).examenTemplate.findUnique({ where: { id: params.id } });
    if (!examen)
      return NextResponse.json({ error: "Simulacro no encontrado" }, { status: 404 });

    // ✅ VALIDAR transición de estado
    const transicionesPermitidas = TRANSICIONES_VALIDAS[examen.estado] || [];
    if (!transicionesPermitidas.includes(estado)) {
      return NextResponse.json(
        { error: `Transición no permitida: ${examen.estado} → ${estado}` },
        { status: 400 }
      );
    }

    // ✅ VALIDAR: No permitir reapertura de exámenes cerrados
    if (examen.estado === "CERRADO" && estado === "PUBLICADO") {
      return NextResponse.json(
        { error: "No se puede reaperturar un examen que ya fue cerrado" },
        { status: 400 }
      );
    }

    // Si pasa a CERRADO ejecutar cálculo TRI vía cron
    if (estado === "CERRADO") {
      try {
        const cronRes = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/cron/calcular-tri`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "x-admin-secret": process.env.CRON_SECRET || "",
          },
          body: JSON.stringify({ examenId: params.id, cerrar: false }),
        });
        if (!cronRes.ok) {
          console.warn("[PATCH cerrar TRI]", await cronRes.text());
        }
      } catch (e: any) {
        console.warn("[PATCH cerrar TRI]", e?.message);
        // No bloquear el cierre si el TRI falla
      }
    }

    const updated = await (db as any).examenTemplate.update({
      where: { id: params.id },
      data:  { estado },
    });

    await _auditLog(session.user.id, params.id, examen.nombre,
      `Estado cambiado a ${estado}`);

    return NextResponse.json({ ok: true, examen: updated });
  } catch (e) {
    console.error("[PATCH /api/admin/simulacros/[id]]", e);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────
// PUT — editar datos generales del simulacro (nombre, materia, tiempos, fechas)
// ─────────────────────────────────────────────────────────────────────────
export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (!(await verificarAdmin(session.user.id)))
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

    const body   = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      const msgs = parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
      return NextResponse.json({ error: msgs[0], detalles: msgs }, { status: 400 });
    }

    const examen = await (db as any).examenTemplate.findUnique({ where: { id: params.id } });
    if (!examen)
      return NextResponse.json({ error: "Simulacro no encontrado" }, { status: 404 });

    const { nombre, materia, totalPreguntas, tiempoMin, estado, claves,
            fechaDisponible: fdRaw, fechaCierre: fcRaw } = parsed.data;

    // Construir objeto de actualización
    const updateData: Record<string, any> = {};
    if (nombre         !== undefined) updateData.nombre         = nombre;
    if (materia        !== undefined) updateData.materia        = materia;
    if (totalPreguntas !== undefined) updateData.totalPreguntas = totalPreguntas;
    if (tiempoMin      !== undefined) updateData.tiempoMin      = tiempoMin;
    if (estado         !== undefined) updateData.estado         = estado;

    // Fechas: aceptar datetime-local o ISO completo o null
    if (fdRaw !== undefined) updateData.fechaDisponible = parseFecha(fdRaw);
    if (fcRaw !== undefined) updateData.fechaCierre     = parseFecha(fcRaw);

    // Si vienen claves, reemplazarlas
    if (claves && claves.length > 0) {
      // Traer sesiones existentes para mapear sesionNumero → sesionId
      const sesionesExistentes = await (db as any).sesionExamen.findMany({
        where: { examenId: params.id },
        orderBy: { numero: "asc" },
      });
      const sesionMap = new Map<number, string>(
        sesionesExistentes.map((s: any) => [s.numero, s.id])
      );
      const sesionDefault = sesionesExistentes[0]?.id ?? null;

      // Eliminar claves anteriores
      await (db as any).claveExamen.deleteMany({ where: { examenId: params.id } });

      // Crear nuevas
      await (db as any).claveExamen.createMany({
        data: claves.map((c) => ({
          examenId:       params.id,
          numeroPregunta: c.numeroPregunta,
          respuesta:      c.respuesta,
          sesionId:       c.sesionNumero
            ? (sesionMap.get(c.sesionNumero) ?? sesionDefault)
            : sesionDefault,
        })),
      });
    }

    const updated = await (db as any).examenTemplate.update({
      where: { id: params.id },
      data:  updateData,
      include: {
        sesiones: { orderBy: { numero: "asc" } },
        _count:   { select: { claves: true } },
      },
    });

    await _auditLog(session.user.id, params.id, examen.nombre, "Simulacro editado");

    return NextResponse.json({ ok: true, examen: updated });
  } catch (e: any) {
    console.error("[PUT /api/admin/simulacros/[id]]", e);
    return NextResponse.json({ error: "Error interno del servidor", detalle: e?.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────
// DELETE — eliminar (solo BORRADOR)
// ─────────────────────────────────────────────────────────────────────────
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (!(await verificarAdmin(session.user.id)))
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

    const examen = await (db as any).examenTemplate.findUnique({ where: { id: params.id } });
    if (!examen)
      return NextResponse.json({ error: "Simulacro no encontrado" }, { status: 404 });

    if (examen.estado !== "BORRADOR")
      return NextResponse.json(
        { error: "Solo se pueden eliminar simulacros en estado Borrador" },
        { status: 400 },
      );

    await (db as any).examenTemplate.delete({ where: { id: params.id } });

    await _auditLog(session.user.id, params.id, examen.nombre, "Simulacro eliminado");

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE /api/admin/simulacros/[id]]", e);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Audit log
// ─────────────────────────────────────────────────────────────────────────
async function _auditLog(userId: string, examenId: string, nombre: string, mensaje: string) {
  try {
    await db.auditLog.create({
      data: {
        usuarioId: userId,
        accion:    "GESTIONAR_SIMULACRO",
        recurso:   "examen_template",
        recursoId: examenId,
        resultado: "EXITOSO",
        mensaje:   `"${nombre}": ${mensaje}`,
      },
    });
  } catch { /* no bloquear */ }
}