// app/api/admin/simulacros/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// ── Esquema para actualizar ────────────────────────────────────────────────
const updateSimulacroSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio").max(120).optional(),
  materia: z.string().min(1, "La materia es obligatoria").optional(),
  totalPreguntas: z.number().int().positive().optional(),
  tiempoMin: z.number().int().positive().optional(),
  sesiones: z.boolean().optional(),
  fechaResultados: z.string().datetime().optional(),
  claves: z
    .array(
      z.object({
        id: z.string().optional(),
        numeroPregunta: z.number().int().positive(),
        respuesta: z.enum(["A", "B", "C", "D"]),
        sesionNumero: z.union([z.literal(1), z.literal(2)]).optional(),
      })
    )
    .optional(),
  estado: z.enum(["BORRADOR", "PUBLICADO", "CERRADO", "ARCHIVADO"]).optional(),
});

function calcularPuntajePreliminar(aciertos: number, total: number) {
  if (total <= 0) return 0;
  return Number((Math.pow(aciertos / total, 1.8) * 100).toFixed(2));
}

function pearsonCorrelation(x: number[], y: number[]) {
  const n = Math.min(x.length, y.length);
  if (n === 0) return 0;

  const meanX = x.reduce((sum, value) => sum + value, 0) / n;
  const meanY = y.reduce((sum, value) => sum + value, 0) / n;

  let numerator = 0;
  let sumX = 0;
  let sumY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    sumX += dx * dx;
    sumY += dy * dy;
  }

  const denominator = Math.sqrt(sumX * sumY);
  if (denominator === 0) return 0;
  return numerator / denominator;
}

async function cerrarSimulacro(examenId: string) {
  const examen = await (db as any).examenTemplate.findUnique({
    where: { id: examenId },
    include: {
      sesionesExamen: { include: { claves: true } },
      claves: true,
    },
  });

  if (!examen) {
    throw new Error("Simulacro no encontrado");
  }

  const sesiones = examen.sesionesExamen.length
    ? examen.sesionesExamen
    : [
        await (db as any).sesionExamen.create({
          data: {
            examenId,
            numero: 1,
            nombre: "Sesión única",
            tiempoMin: examen.tiempoMin,
          },
        }),
      ];

  const resultadosSesion = await (db as any).resultadoSesion.findMany({
    where: { examenId },
    include: { sesion: true },
  });

  if (resultadosSesion.length === 0) {
    throw new Error("No hay resultados para cerrar el simulacro");
  }

  await (db as any).pesosPregunta.deleteMany({ where: { examenId } });

  const clavesPorSesion = new Map<string, any[]>();
  examen.claves.forEach((clave: any) => {
    const sessionId = clave.sesionId ?? sesiones[0].id;
    const current = clavesPorSesion.get(sessionId) ?? [];
    current.push(clave);
    clavesPorSesion.set(sessionId, current);
  });

  const pesosPorSesion = new Map<string, Record<number, { pesoNormalizado: number }>>();

  for (const sesion of sesiones) {
    const claves = clavesPorSesion.get(sesion.id) ?? [];
    const resultsInSession = resultadosSesion.filter(
      (r: any) => r.sesionId === sesion.id
    );

    const studentData = resultsInSession.map((result: any) => {
      const respuestas = result.respuestas || {};
      const itemCorrect = new Map<number, number>();
      let aciertos = 0;

      claves.forEach((clave: any) => {
        const dado = respuestas[String(clave.numeroPregunta)] ?? null;
        const correcto = dado === clave.respuesta ? 1 : 0;
        itemCorrect.set(clave.numeroPregunta, correcto);
        aciertos += correcto;
      });

      return {
        id: result.id,
        estudianteId: result.estudianteId,
        respuestas,
        aciertos,
        itemCorrect,
      };
    });

    const itemStats = claves.map((clave: any) => {
      const valores: number[] = [];
      const pistas: number[] = [];

      studentData.forEach((student) => {
        const valor = student.itemCorrect.get(clave.numeroPregunta) ?? 0;
        valores.push(valor);
        pistas.push(student.aciertos - valor);
      });

      const correctRatio = valores.length
        ? valores.reduce((sum, value) => sum + value, 0) / valores.length
        : 0;
      const dificultad = 1 - correctRatio;
      const discriminacion = pearsonCorrelation(valores, pistas);
      const peso = dificultad * (1 + discriminacion);

      return {
        numeroPregunta: clave.numeroPregunta,
        dificultad,
        discriminacion,
        peso,
      };
    });

    const totalPeso = itemStats.reduce((sum, item) => sum + item.peso, 0);
    const pesosNormalizados = itemStats.map((item) => ({
      ...item,
      pesoNormalizado:
        totalPeso > 0
          ? Number(((item.peso / totalPeso) * Math.max(claves.length, 1)).toFixed(6))
          : Number((1 / Math.max(claves.length, 1)).toFixed(6)),
    }));

    if (pesosNormalizados.length > 0) {
      await (db as any).pesosPregunta.createMany({
        data: pesosNormalizados.map((item) => ({
          examenId,
          sesionId: sesion.id,
          numeroPregunta: item.numeroPregunta,
          dificultad: Number(item.dificultad.toFixed(4)),
          discriminacion: Number(item.discriminacion.toFixed(4)),
          pesoNormalizado: item.pesoNormalizado,
        })),
      });
    }

    const pesosMap: Record<number, { pesoNormalizado: number }> = {};
    pesosNormalizados.forEach((item) => {
      pesosMap[item.numeroPregunta] = { pesoNormalizado: item.pesoNormalizado };
    });
    pesosPorSesion.set(sesion.id, pesosMap);

    for (const result of resultsInSession) {
      const respuestas = result.respuestas || {};
      let aciertos = 0;
      let weightedCorrect = 0;

      claves.forEach((clave: any) => {
        const dado = respuestas[String(clave.numeroPregunta)] ?? null;
        const correcto = dado === clave.respuesta ? 1 : 0;
        aciertos += correcto;
        if (correcto) {
          weightedCorrect += pesosMap[clave.numeroPregunta]?.pesoNormalizado ?? 0;
        }
      });

      const puntajePreliminar = calcularPuntajePreliminar(aciertos, result.total ?? claves.length);
      const puntajeTRI = Number(
        Math.pow(
          Math.max(Math.min(weightedCorrect / Math.max(result.total ?? claves.length, 1), 1), 0),
          1.8
        ) * 100
      ).toFixed(2);

      await (db as any).resultadoSesion.update({
        where: { id: result.id },
        data: {
          aciertos,
          puntajePreliminar,
          puntajeTRI: Number(puntajeTRI),
        },
      });
    }
  }

  const resultadosSesionActualizados = await (db as any).resultadoSesion.findMany({
    where: { examenId },
  });

  const resultadosPorEstudiante = new Map<string, any[]>();
  resultadosSesionActualizados.forEach((result: any) => {
    const current = resultadosPorEstudiante.get(result.estudianteId) ?? [];
    current.push(result);
    resultadosPorEstudiante.set(result.estudianteId, current);
  });

  for (const [estudianteId, resultados] of resultadosPorEstudiante.entries()) {
    const totalAcertados = resultados.reduce(
      (sum: number, result: any) => sum + (result.aciertos ?? 0),
      0
    );
    const totalPreguntas = resultados.reduce(
      (sum: number, result: any) => sum + (result.total ?? 0),
      0
    );
    const sumaPreliminar = resultados.reduce(
      (sum: number, result: any) => sum + ((result.puntajePreliminar ?? 0) * (result.total ?? 0)),
      0
    );
    const sumaTRI = resultados.reduce(
      (sum: number, result: any) => sum + ((result.puntajeTRI ?? 0) * (result.total ?? 0)),
      0
    );

    const globalPreliminar = totalPreguntas
      ? Number((sumaPreliminar / totalPreguntas).toFixed(2))
      : 0;
    const globalTRI = totalPreguntas
      ? Number((sumaTRI / totalPreguntas).toFixed(2))
      : 0;

    const respuestasCombinadas = resultados.reduce(
      (acc: any, result: any) => ({ ...acc, ...(result.respuestas ?? {}) }),
      {}
    );

    await (db as any).resultadoSimulacro.update({
      where: {
        estudianteId_examenId: {
          estudianteId,
          examenId,
        },
      },
      data: {
        respuestas: respuestasCombinadas,
        puntaje: totalAcertados,
        total: totalPreguntas,
        puntajePreliminar: globalPreliminar,
        puntajeTRI: globalTRI,
        estadoCalif: "OFICIAL",
      },
    });
  }
}

// ── GET: Obtener un simulacro específico ────────────────────────────────────
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const usuario = await db.usuario.findUnique({
      where: { id: session.user.id },
      select: { rol: true },
    });

    if (!usuario || usuario.rol !== "ADMIN") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const examen = await (db as any).examenTemplate.findUnique({
      where: { id: params.id },
      include: {
        claves: true,
        sesionesExamen: true,
        resultados: true,
        pesosPregunta: true,
      },
    });

    if (!examen) {
      return NextResponse.json(
        { error: "Simulacro no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ examen });
  } catch (error) {
    console.error("[GET /api/admin/simulacros/[id]]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// ── PATCH: Actualizar solo el estado (Publicar, Cerrar, Archivar) ───────────
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const usuario = await db.usuario.findUnique({
      where: { id: session.user.id },
      select: { rol: true },
    });

    if (!usuario || usuario.rol !== "ADMIN") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const body = await req.json();
    const { estado } = body;

    if (!estado || !["BORRADOR", "PUBLICADO", "CERRADO", "ARCHIVADO"].includes(estado)) {
      return NextResponse.json(
        { error: "Estado inválido" },
        { status: 400 }
      );
    }

    // Verificar que el simulacro existe
    const examen = await (db as any).examenTemplate.findUnique({
      where: { id: params.id },
    });

    if (!examen) {
      return NextResponse.json(
        { error: "Simulacro no encontrado" },
        { status: 404 }
      );
    }

    if (estado === "CERRADO") {
      await cerrarSimulacro(params.id);
    }

    // Actualizar estado
    const updated = await (db as any).examenTemplate.update({
      where: { id: params.id },
      data: { estado },
    });

    // Audit log
    try {
      await db.auditLog.create({
        data: {
          usuarioId: session.user.id,
          accion: "ACTUALIZAR_SIMULACRO",
          recurso: "examen_template",
          recursoId: params.id,
          resultado: "EXITOSO",
          mensaje: `Simulacro "${examen.nombre}" cambiado a estado ${estado}`,
        },
      });
    } catch {
      // No bloquear
    }

    return NextResponse.json({ ok: true, examen: updated });
  } catch (error) {
    console.error("[PATCH /api/admin/simulacros/[id]]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// ── PUT: Editar simulacro completo ─────────────────────────────────────────
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const usuario = await db.usuario.findUnique({
      where: { id: session.user.id },
      select: { rol: true },
    });

    if (!usuario || usuario.rol !== "ADMIN") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateSimulacroSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }

    const { nombre, materia, totalPreguntas, tiempoMin, claves, estado, sesiones, fechaResultados } =
      parsed.data;

    // Verificar que el simulacro existe
    const examen = await (db as any).examenTemplate.findUnique({
      where: { id: params.id },
    });

    if (!examen) {
      return NextResponse.json(
        { error: "Simulacro no encontrado" },
        { status: 404 }
      );
    }

    // Revisar sesiones existentes
    const sesionesExistentes = await (db as any).sesionExamen.findMany({
      where: { examenId: params.id },
    });

    let sesion1 = sesionesExistentes.find((s: any) => s.numero === 1);
    let sesion2 = sesionesExistentes.find((s: any) => s.numero === 2);

    if (!sesion1) {
      sesion1 = await (db as any).sesionExamen.create({
        data: {
          examenId: params.id,
          numero: 1,
          nombre: "Sesión 1 - Primer bloque",
          tiempoMin: tiempoMin ?? examen.tiempoMin,
        },
      });
    }

    if (sesiones && !sesion2) {
      sesion2 = await (db as any).sesionExamen.create({
        data: {
          examenId: params.id,
          numero: 2,
          nombre: "Sesión 2 - Segundo bloque",
          tiempoMin: tiempoMin ?? examen.tiempoMin,
        },
      });
    }

    // Preparar data para actualizar
    const updateData: any = {};
    if (nombre) updateData.nombre = nombre;
    if (materia) updateData.materia = materia;
    if (totalPreguntas) updateData.totalPreguntas = totalPreguntas;
    if (tiempoMin) updateData.tiempoMin = tiempoMin;
    if (estado) updateData.estado = estado;
    if (sesiones !== undefined) updateData.sesiones = sesiones;
    if (fechaResultados) updateData.fechaResultados = new Date(fechaResultados);

    // Si hay claves nuevas, actualizar
    if (claves && claves.length > 0) {
      const clavesValidas = claves.filter((c) => c.respuesta);

      if (clavesValidas.length === 0) {
        return NextResponse.json(
          { error: "Define al menos una respuesta correcta" },
          { status: 400 }
        );
      }

      // Eliminar claves antiguas
      await (db as any).claveExamen.deleteMany({
        where: { examenId: params.id },
      });

      const mitad = Math.ceil((totalPreguntas ?? examen.totalPreguntas) / 2);
      updateData.claves = {
        create: clavesValidas.map((c) => ({
          numeroPregunta: c.numeroPregunta,
          respuesta: c.respuesta,
          sesionId:
            sesiones && c.sesionNumero === 2
              ? sesion2?.id
              : sesiones && c.sesionNumero === 1
              ? sesion1.id
              : sesiones && c.numeroPregunta > mitad
              ? sesion2?.id ?? sesion1.id
              : sesion1.id,
        })),
      };
    }

    // Actualizar simulacro
    const updated = await (db as any).examenTemplate.update({
      where: { id: params.id },
      data: updateData,
      include: { claves: true },
    });

    // Audit log
    try {
      await db.auditLog.create({
        data: {
          usuarioId: session.user.id,
          accion: "EDITAR_SIMULACRO",
          recurso: "examen_template",
          recursoId: params.id,
          resultado: "EXITOSO",
          mensaje: `Simulacro "${examen.nombre}" actualizado`,
        },
      });
    } catch {
      // No bloquear
    }

    return NextResponse.json({ ok: true, examen: updated });
  } catch (error) {
    console.error("[PUT /api/admin/simulacros/[id]]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// ── DELETE: Eliminar simulacro ─────────────────────────────────────────────
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const usuario = await db.usuario.findUnique({
      where: { id: session.user.id },
      select: { rol: true },
    });

    if (!usuario || usuario.rol !== "ADMIN") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    // Verificar que el simulacro existe
    const examen = await (db as any).examenTemplate.findUnique({
      where: { id: params.id },
    });

    if (!examen) {
      return NextResponse.json(
        { error: "Simulacro no encontrado" },
        { status: 404 }
      );
    }

    // Solo permitir eliminar borradores
    if (examen.estado !== "BORRADOR") {
      return NextResponse.json(
        { error: "Solo se pueden eliminar simulacros en borrador" },
        { status: 400 }
      );
    }

    // Eliminar simulacro (cascade eliminará las claves)
    await (db as any).examenTemplate.delete({
      where: { id: params.id },
    });

    // Audit log
    try {
      await db.auditLog.create({
        data: {
          usuarioId: session.user.id,
          accion: "ELIMINAR_SIMULACRO",
          recurso: "examen_template",
          recursoId: params.id,
          resultado: "EXITOSO",
          mensaje: `Simulacro "${examen.nombre}" eliminado`,
        },
      });
    } catch {
      // No bloquear
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/admin/simulacros/[id]]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
