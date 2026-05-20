// app/api/admin/simulacros/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

type ClaveItem = {
  numeroPregunta: number;
  respuesta: string;
  sesionId?: string | null;
};

type RespuestasMap = Record<string, string | null | undefined>;

type StudentData = {
  id: string;
  estudianteId: string;
  itemCorrect: Map<number, number>;
  aciertos: number;
};

type ItemStat = {
  numeroPregunta: number;
  dificultad: number;
  discriminacion: number;
  peso: number;
};

type ResultadoGlobal = {
  estudianteId: string;
  aciertos?: number | null;
  total?: number | null;
  puntajePreliminar?: number | null;
  puntajeTRI?: number | null;
};

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

    // Si pasa a CERRADO ejecutar cálculo TRI
    if (estado === "CERRADO") {
      try {
        await cerrarSimulacro(params.id);
      } catch (e: any) {
        // Si no hay resultados aún, solo cambiar estado sin bloquear
        console.warn("[PATCH cerrar TRI]", e?.message);
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
// Lógica TRI simplificada al cerrar
// ─────────────────────────────────────────────────────────────────────────
function pearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n === 0) return 0;
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx, dy = y[i] - my;
    num += dx * dy; dx2 += dx * dx; dy2 += dy * dy;
  }
  const den = Math.sqrt(dx2 * dy2);
  return den === 0 ? 0 : num / den;
}

async function cerrarSimulacro(examenId: string) {
  const examen = await (db as any).examenTemplate.findUnique({
    where:   { id: examenId },
    include: { sesiones: { include: { claves: true } }, claves: true },
  });
  if (!examen) return;

  const sesiones = examen.sesiones.length
    ? examen.sesiones
    : [await (db as any).sesionExamen.create({
        data: { examenId, numero: 1, nombre: "Sesión única", tiempoMin: examen.tiempoMin },
      })];

  for (const sesion of sesiones) {
    const resultadosSesion: Array<{
      id: string;
      estudianteId: string;
      respuestas?: Record<string, string> | null;
      total?: number | null;
      puntajePreliminar?: number | null;
      puntajeTRI?: number | null;
    }> = await (db as any).resultadoSesion.findMany({
      where: { examenId, sesionId: sesion.id },
    });
    if (!resultadosSesion.length) continue;

    const claves: ClaveItem[] = sesion.claves?.length
      ? sesion.claves
      : examen.claves.filter((c: ClaveItem) => !c.sesionId || c.sesionId === sesion.id);

    // Calcular pesos
    const studentData: StudentData[] = resultadosSesion.map((r) => {
      const resp = (r.respuestas ?? {}) as RespuestasMap;
      let aciertos = 0;
      const itemCorrect = new Map<number, number>();
      claves.forEach((c) => {
        const correcto = (resp[String(c.numeroPregunta)] ?? null) === c.respuesta ? 1 : 0;
        itemCorrect.set(c.numeroPregunta, correcto);
        aciertos += correcto;
      });
      return { id: r.id, estudianteId: r.estudianteId, itemCorrect, aciertos };
    });

    const itemStats: ItemStat[] = claves.map((c) => {
      const valores = studentData.map((s) => s.itemCorrect.get(c.numeroPregunta) ?? 0);
      const pistas = studentData.map((s) => s.aciertos - (s.itemCorrect.get(c.numeroPregunta) ?? 0));
      const correctRatio = valores.reduce((a, b) => a + b, 0) / (valores.length || 1);
      const dificultad = 1 - correctRatio;
      const discriminacion = Math.max(0, Math.min(pearsonCorrelation(valores, pistas), 1));
      return { numeroPregunta: c.numeroPregunta, dificultad, discriminacion, peso: dificultad * (1 + discriminacion) };
    });

    const totalPeso = itemStats.reduce((a, i) => a + i.peso, 0);
    const pesosNorm = itemStats.map((i) => ({
      ...i,
      pesoNormalizado: totalPeso > 0
        ? Number(((i.peso / totalPeso) * claves.length).toFixed(6))
        : Number((1 / Math.max(claves.length, 1)).toFixed(6)),
    }));

    if (pesosNorm.length > 0) {
      await (db as any).pesosPregunta.deleteMany({ where: { examenId, sesionId: sesion.id } });
      await (db as any).pesosPregunta.createMany({
        data: pesosNorm.map((p) => ({
          examenId, sesionId: sesion.id,
          numeroPregunta: p.numeroPregunta,
          dificultad:     Number(p.dificultad.toFixed(4)),
          discriminacion: Number(p.discriminacion.toFixed(4)),
          pesoNormalizado: p.pesoNormalizado,
        })),
      });
    }

    const pesosMap = new Map(pesosNorm.map((p) => [p.numeroPregunta, p.pesoNormalizado]));

    for (const result of resultadosSesion) {
      const resp = result.respuestas ?? {};
      let aciertos = 0, weightedCorrect = 0;
      claves.forEach((c: any) => {
        const correcto = (resp[String(c.numeroPregunta)] ?? null) === c.respuesta ? 1 : 0;
        aciertos += correcto;
        if (correcto) weightedCorrect += pesosMap.get(c.numeroPregunta) ?? 0;
      });
      const total = result.total ?? claves.length;
      const puntajePreliminar = total > 0 ? Number((Math.pow(aciertos / total, 1.8) * 100).toFixed(2)) : 0;
      const puntajeTRI = Number((Math.pow(Math.min(weightedCorrect / Math.max(total, 1), 1), 1.8) * 100).toFixed(2));

      await (db as any).resultadoSesion.update({
        where: { id: result.id },
        data:  { aciertos, puntajePreliminar, puntajeTRI },
      });
    }
  }

  // Actualizar ResultadoSimulacro global
  const todosResultados = await (db as any).resultadoSesion.findMany({
    where: { examenId },
  });
  const porEstudiante = new Map<string, ResultadoGlobal[]>();
  for (const r of todosResultados as ResultadoGlobal[]) {
    if (!porEstudiante.has(r.estudianteId)) porEstudiante.set(r.estudianteId, []);
    porEstudiante.get(r.estudianteId)!.push(r);
  }

  for (const [estudianteId, resultados] of porEstudiante) {
    const totalAciertos  = resultados.reduce((a, r) => a + (r.aciertos ?? 0), 0);
    const totalPreguntas = resultados.reduce((a, r) => a + (r.total ?? 0), 0);
    const sumaPreliminar = resultados.reduce((a, r) => a + ((r.puntajePreliminar ?? 0) * (r.total ?? 0)), 0);
    const sumaTRI        = resultados.reduce((a, r) => a + ((r.puntajeTRI ?? 0) * (r.total ?? 0)), 0);

    await (db as any).resultadoSimulacro.updateMany({
      where: { estudianteId, examenId },
      data: {
        puntaje:           totalAciertos,
        total:             totalPreguntas,
        puntajePreliminar: totalPreguntas ? Number((sumaPreliminar / totalPreguntas).toFixed(2)) : 0,
        puntajeTRI:        totalPreguntas ? Number((sumaTRI        / totalPreguntas).toFixed(2)) : 0,
        estadoCalif:       "OFICIAL",
      },
    });
  }

  await (db as any).examenTemplate.update({
    where: { id: examenId },
    data:  { triCalculado: true },
  });
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