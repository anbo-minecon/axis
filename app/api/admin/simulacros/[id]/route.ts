// app/api/admin/simulacros/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { calcularTRIGrupo } from "@/lib/tri-engine";

// ── Helpers ────────────────────────────────────────────────────────────────
function parseFecha(valor: string | null | undefined): Date | null {
  if (!valor) return null;
  const t = valor.trim();
  if (!t) return null;
  const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(t) ? `${t}:00.000Z` : t;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

async function verificarAdmin(userId: string) {
  const u = await db.usuario.findUnique({ where: { id: userId }, select: { rol: true } });
  return u?.rol === "ADMIN";
}

// ── Schemas ────────────────────────────────────────────────────────────────
const updateSchema = z.object({
  nombre:          z.string().min(1).max(120).optional(),
  materia:         z.string().min(1).optional(),
  totalPreguntas:  z.number().int().positive().optional(),
  tiempoMin:       z.number().int().positive().optional(),
  // BUG FIX #1: CERRADO añadido al enum de validación Zod (igual que en schema.prisma)
  estado:          z.enum(["BORRADOR", "PUBLICADO", "CERRADO", "ARCHIVADO"]).optional(),
  fechaDisponible: z.string().optional().nullable(),
  fechaCierre:     z.string().optional().nullable(),
  claves: z.array(z.object({
    numeroPregunta: z.number().int().positive(),
    respuesta:      z.enum(["A", "B", "C", "D"]),
    sesionNumero:   z.number().int().positive().optional(),
  })).optional(),
});

// ─────────────────────────────────────────────────────────────────────────
// GET
// ─────────────────────────────────────────────────────────────────────────
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (!(await verificarAdmin(session.user.id))) return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

    const examen = await (db as any).examenTemplate.findUnique({
      where: { id: params.id },
      include: {
        claves:   { orderBy: { numeroPregunta: "asc" } },
        sesiones: { orderBy: { numero: "asc" } },
        resultados: true,
        pesos:    true,
      },
    });
    if (!examen) return NextResponse.json({ error: "Simulacro no encontrado" }, { status: 404 });
    return NextResponse.json({ examen });
  } catch (e) {
    console.error("[GET /api/admin/simulacros/[id]]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────
// PATCH — cambiar estado (incluye CERRADO → dispara TRI)
// ─────────────────────────────────────────────────────────────────────────
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (!(await verificarAdmin(session.user.id))) return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

    const body = await req.json();
    const { estado } = body;

    // BUG FIX #1: CERRADO incluido en la lista de estados válidos
    if (!estado || !["BORRADOR", "PUBLICADO", "CERRADO", "ARCHIVADO"].includes(estado)) {
      return NextResponse.json({ error: `Estado inválido: "${estado}"` }, { status: 400 });
    }

    const examen = await (db as any).examenTemplate.findUnique({
      where: { id: params.id },
      include: {
        sesiones: {
          include: { claves: { orderBy: { numeroPregunta: "asc" } } },
          orderBy: { numero: "asc" },
        },
        claves: { orderBy: { numeroPregunta: "asc" } },
      },
    });
    if (!examen) return NextResponse.json({ error: "Simulacro no encontrado" }, { status: 404 });

    // BUG FIX #3: al cerrar, ejecutar TRI antes de cambiar estado
    // Antes el TRI solo lo ejecutaba el cron; ahora también se dispara manualmente.
    let triEjecutado = false;
    let triError: string | null = null;

    if (estado === "CERRADO" && !examen.triCalculado) {
      try {
        await ejecutarTRI(examen);
        triEjecutado = true;
      } catch (e: any) {
        // No bloquear el cierre si el TRI falla (ej. sin participantes aún)
        triError = e?.message ?? "Error en cálculo TRI";
        console.warn("[PATCH cerrar] TRI no ejecutado:", triError);
      }
    }

    // Actualizar estado (y marcar triCalculado si el TRI corrió)
    const updated = await (db as any).examenTemplate.update({
      where: { id: params.id },
      data: {
        estado,
        ...(triEjecutado ? { triCalculado: true } : {}),
      },
    });

    await _auditLog(session.user.id, params.id, examen.nombre,
      `Estado → ${estado}${triEjecutado ? " (TRI calculado)" : ""}${triError ? ` (TRI pendiente: ${triError})` : ""}`);

    return NextResponse.json({
      ok: true,
      examen: updated,
      triEjecutado,
      triError,
    });
  } catch (e: any) {
    console.error("[PATCH /api/admin/simulacros/[id]]", e);
    return NextResponse.json({ error: "Error interno", detalle: e?.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────
// PUT — editar datos generales
// ─────────────────────────────────────────────────────────────────────────
export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (!(await verificarAdmin(session.user.id))) return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

    const body   = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      const msgs = parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
      return NextResponse.json({ error: msgs[0], detalles: msgs }, { status: 400 });
    }

    const examen = await (db as any).examenTemplate.findUnique({ where: { id: params.id } });
    if (!examen) return NextResponse.json({ error: "Simulacro no encontrado" }, { status: 404 });

    const { nombre, materia, totalPreguntas, tiempoMin, estado, claves,
            fechaDisponible: fdRaw, fechaCierre: fcRaw } = parsed.data;

    const updateData: Record<string, any> = {};
    if (nombre         !== undefined) updateData.nombre         = nombre;
    if (materia        !== undefined) updateData.materia        = materia;
    if (totalPreguntas !== undefined) updateData.totalPreguntas = totalPreguntas;
    if (tiempoMin      !== undefined) updateData.tiempoMin      = tiempoMin;
    if (estado         !== undefined) updateData.estado         = estado;
    if (fdRaw          !== undefined) updateData.fechaDisponible = parseFecha(fdRaw);
    if (fcRaw          !== undefined) updateData.fechaCierre     = parseFecha(fcRaw);

    if (claves && claves.length > 0) {
      const sesionesExistentes = await (db as any).sesionExamen.findMany({
        where: { examenId: params.id }, orderBy: { numero: "asc" },
      });
      const sesionMap = new Map<number, string>(
        sesionesExistentes.map((s: any) => [s.numero, s.id])
      );
      const sesionDefault = sesionesExistentes[0]?.id ?? null;

      await (db as any).claveExamen.deleteMany({ where: { examenId: params.id } });
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

    await _auditLog(session.user.id, params.id, examen.nombre, "Datos editados");
    return NextResponse.json({ ok: true, examen: updated });
  } catch (e: any) {
    console.error("[PUT /api/admin/simulacros/[id]]", e);
    return NextResponse.json({ error: "Error interno", detalle: e?.message }, { status: 500 });
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
    if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (!(await verificarAdmin(session.user.id))) return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

    const examen = await (db as any).examenTemplate.findUnique({ where: { id: params.id } });
    if (!examen) return NextResponse.json({ error: "Simulacro no encontrado" }, { status: 404 });

    if (examen.estado !== "BORRADOR") {
      return NextResponse.json(
        { error: "Solo se pueden eliminar simulacros en estado Borrador" },
        { status: 400 },
      );
    }

    await (db as any).examenTemplate.delete({ where: { id: params.id } });
    await _auditLog(session.user.id, params.id, examen.nombre, "Simulacro eliminado");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE /api/admin/simulacros/[id]]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Cálculo TRI interno (misma lógica que el cron pero integrado aquí)
// BUG FIX #4: usa campo "aciertos" (no "correctas") al leer ResultadoSesion
// BUG FIX #5: usa "pesosPregunta" (nombre correcto del modelo Prisma, no "pesoPregunta")
// ─────────────────────────────────────────────────────────────────────────
async function ejecutarTRI(examen: any) {
  const tieneSesiones = examen.tieneSesiones && examen.sesiones?.length > 0;

  if (tieneSesiones) {
    for (const sesion of examen.sesiones) {
      // BUG FIX #4: select incluye "aciertos" no "correctas"
      const resultadosSesion = await (db as any).resultadoSesion.findMany({
        where:  { sesionId: sesion.id },
        select: { estudianteId: true, respuestas: true, aciertos: true, total: true },
      });
      if (!resultadosSesion.length) continue;

      const claves: Record<string, string> = {};
      for (const c of sesion.claves) claves[String(c.numeroPregunta)] = c.respuesta;

      const { pesos, resultados } = calcularTRIGrupo(
        resultadosSesion.map((r: any) => ({ estudianteId: r.estudianteId, respuestas: r.respuestas })),
        claves,
      );

      if (pesos.length > 0) {
        // BUG FIX #5: modelo correcto es "pesosPregunta" (plural con mayúscula)
        await (db as any).pesosPregunta.createMany({
          data: pesos.map((p) => ({
            examenId:        examen.id,
            sesionId:        sesion.id,
            numeroPregunta:  p.numeroPregunta,
            dificultad:      p.dificultad,
            discriminacion:  p.discriminacion,
            pesoNormalizado: p.pesoNormalizado,
          })),
          skipDuplicates: true,
        });
      }

      for (const r of resultados) {
        await (db as any).resultadoSesion.updateMany({
          where: { estudianteId: r.estudianteId, sesionId: sesion.id },
          data:  { puntajeTRI: r.puntajeTRI },
        });
      }
    }

    // Consolidar TRI global por estudiante
    const todosRS = await (db as any).resultadoSesion.findMany({
      where: { examenId: examen.id, puntajeTRI: { not: null } },
      select: { estudianteId: true, puntajeTRI: true, total: true },
    });

    const porEstudiante = new Map<string, { sum: number; totalPts: number }>();
    for (const r of todosRS) {
      const prev = porEstudiante.get(r.estudianteId) ?? { sum: 0, totalPts: 0 };
      porEstudiante.set(r.estudianteId, {
        sum:      prev.sum + (r.puntajeTRI * r.total),
        totalPts: prev.totalPts + r.total,
      });
    }

    for (const [estudianteId, { sum, totalPts }] of porEstudiante) {
      const triGlobal = totalPts > 0 ? Number((sum / totalPts).toFixed(2)) : 0;
      await (db as any).resultadoSimulacro.updateMany({
        where: { estudianteId, examenId: examen.id },
        data:  { puntajeTRI: triGlobal, estadoCalif: "OFICIAL" },
      });
    }

  } else {
    // Sin sesiones
    const resultados = await (db as any).resultadoSimulacro.findMany({
      where:  { examenId: examen.id },
      select: { estudianteId: true, respuestas: true },
    });
    if (!resultados.length) return;

    const claves: Record<string, string> = {};
    for (const c of examen.claves) claves[String(c.numeroPregunta)] = c.respuesta;

    const { pesos, resultados: tri } = calcularTRIGrupo(
      resultados.map((r: any) => ({ estudianteId: r.estudianteId, respuestas: r.respuestas })),
      claves,
    );

    if (pesos.length > 0) {
      // BUG FIX #5: modelo correcto es "pesosPregunta"
      await (db as any).pesosPregunta.createMany({
        data: pesos.map((p) => ({
          examenId:        examen.id,
          numeroPregunta:  p.numeroPregunta,
          dificultad:      p.dificultad,
          discriminacion:  p.discriminacion,
          pesoNormalizado: p.pesoNormalizado,
        })),
        skipDuplicates: true,
      });
    }

    for (const r of tri) {
      await (db as any).resultadoSimulacro.updateMany({
        where: { estudianteId: r.estudianteId, examenId: examen.id },
        data:  { puntajeTRI: r.puntajeTRI, estadoCalif: "OFICIAL" },
      });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Audit log helper
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