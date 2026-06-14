// app/api/classroom/calendario/route.ts
// GET  — eventos del calendario (filtrado por mes/semana)
// POST — crear evento nuevo

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const crearEventoSchema = z.object({
  claseId:      z.string().min(1, "claseId es requerido"),
  titulo:       z.string().min(2).max(200),
  descripcion:  z.string().max(1000).optional(),
  tipo:         z.enum(["CLASE", "TAREA", "EXAMEN", "EVENTO"]).default("CLASE"),
  fechaInicio:  z.string().transform(str => {
    // Aceptar formato: "2026-06-11T20:30" o ISO datetime
    if (!str) throw new Error("fechaInicio es requerido");
    const fecha = new Date(str);
    if (isNaN(fecha.getTime())) throw new Error("fechaInicio debe ser una fecha válida");
    return str;
  }),
  fechaFin:     z.string().transform(str => {
    if (!str) return undefined;
    const fecha = new Date(str);
    if (isNaN(fecha.getTime())) throw new Error("fechaFin debe ser una fecha válida");
    return str;
  }).optional(),
  linkMeet:     z.string().url().optional().or(z.literal("")),
});

// ── GET: Eventos del calendario ───────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const desde = searchParams.get("desde"); // ISO date
    const hasta = searchParams.get("hasta"); // ISO date
    const claseId = searchParams.get("claseId");

    const where: any = {};

    if (desde && hasta) {
      where.fechaInicio = {
        gte: new Date(desde),
        lte: new Date(hasta),
      };
    }

    if (claseId) {
      where.claseId = claseId;
    }

    // Estudiantes: solo eventos de sus clases (por grupo)
    if (session.user.rol === "ESTUDIANTE") {
      const usuario = await db.usuario.findUnique({
        where: { id: session.user.id },
        select: { grupoId: true },
      });

      const clasesDelGrupo = await db.classroomClase.findMany({
        where: { grupoId: usuario?.grupoId ?? "__none__", estado: "ACTIVA" },
        select: { id: true },
      });

      where.claseId = { in: clasesDelGrupo.map((c: any) => c.id) };
    }

    const eventos = await db.classroomEvento.findMany({
      where,
      include: {
        clase: { select: { nombre: true, materia: true, googleCourseId: true } },
      },
      orderBy: { fechaInicio: "asc" },
    });

    return NextResponse.json({ eventos });
  } catch (err: any) {
    console.error("[GET /api/classroom/calendario]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// ── POST: Crear evento ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const rol = session.user.rol;
    if (rol !== "ADMIN" && rol !== "DOCENTE") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = crearEventoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { claseId, titulo, descripcion, tipo, fechaInicio, fechaFin, linkMeet } = parsed.data;

    // Verificar que la clase existe
    const clase = await db.classroomClase.findUnique({
      where: { id: claseId },
      select: { id: true, docenteId: true, nombre: true },
    });
    if (!clase) {
      return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 });
    }

    // Docente solo puede crear en sus clases
    if (session.user.rol === "DOCENTE" && clase.docenteId !== session.user.id) {
      return NextResponse.json({ error: "No tienes acceso a esta clase" }, { status: 403 });
    }

    try {
      const evento = await db.classroomEvento.create({
        data: {
          claseId,
          titulo,
          descripcion:  descripcion ?? null,
          tipo:         tipo as any,
          fechaInicio:  new Date(fechaInicio),
          fechaFin:     fechaFin ? new Date(fechaFin) : null,
          linkMeet:     linkMeet || null,
          completado:   false,
        },
      });

      await db.auditLog.create({
        data: {
          usuarioId: session.user.id,
          accion:    "CREAR_EVENTO_CLASSROOM",
          recurso:   "classroom_evento",
          recursoId: evento.id,
          resultado: "EXITOSO",
          mensaje:   `Evento "${titulo}" creado en clase "${clase.nombre}"`,
        },
      }).catch(() => {});

      return NextResponse.json({ evento }, { status: 201 });
    } catch (parseErr: any) {
      console.error("[POST /api/classroom/calendario] Date parse error:", parseErr);
      return NextResponse.json({ error: "Error en formato de fecha: " + parseErr.message }, { status: 400 });
    }
  } catch (err: any) {
    console.error("[POST /api/classroom/calendario]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}