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
  claves: z
    .array(
      z.object({
        id: z.string().optional(),
        numeroPregunta: z.number().int().positive(),
        respuesta: z.enum(["A", "B", "C", "D"]),
      })
    )
    .optional(),
  estado: z.enum(["BORRADOR", "PUBLICADO", "ARCHIVADO"]).optional(),
});

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
      include: { claves: true },
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

// ── PATCH: Actualizar solo el estado (Publicar, Archivar) ───────────────────
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

    if (!estado || !["BORRADOR", "PUBLICADO", "ARCHIVADO"].includes(estado)) {
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

    const { nombre, materia, totalPreguntas, tiempoMin, claves, estado } =
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

    // Preparar data para actualizar
    const updateData: any = {};
    if (nombre) updateData.nombre = nombre;
    if (materia) updateData.materia = materia;
    if (totalPreguntas) updateData.totalPreguntas = totalPreguntas;
    if (tiempoMin) updateData.tiempoMin = tiempoMin;
    if (estado) updateData.estado = estado;

    // Si hay claves nuevas, actualizar
    if (claves && claves.length > 0) {
      // Filtrar claves válidas (con respuesta)
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

      // Crear nuevas claves
      updateData.claves = {
        create: clavesValidas.map((c) => ({
          numeroPregunta: c.numeroPregunta,
          respuesta: c.respuesta,
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
