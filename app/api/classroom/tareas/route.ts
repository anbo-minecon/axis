// app/api/classroom/tareas/route.ts
// GET  — lista tareas
// POST — crea tarea en Google Classroom y en BD

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { crearTarea } from "@/lib/classroom-client";
import { z } from "zod";

const crearSchema = z.object({
  claseId:       z.string(),
  titulo:        z.string().min(2).max(200),
  descripcion:   z.string().max(1000).optional(),
  linkUrl:       z.string().url().optional().or(z.literal("")),
  fechaEntrega:  z.string().datetime().optional(),
  puntos:        z.number().min(0).max(1000).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const claseId = searchParams.get("claseId");

    const where: any = {};
    if (claseId) where.claseId = claseId;

    // Estudiantes: solo tareas de sus clases
    if (session.user.rol === "ESTUDIANTE") {
      const usuario = await db.usuario.findUnique({
        where: { id: session.user.id },
        select: { grupoId: true },
      });
      const clases = await db.classroomClase.findMany({
        where: { grupoId: usuario?.grupoId ?? "__none__", estado: "ACTIVA" },
        select: { id: true },
      });
      where.claseId = { in: clases.map((c: any) => c.id) };
      where.estado  = "ASIGNADA"; // estudiantes solo ven asignadas
    }

    const tareas = await db.classroomTarea.findMany({
      where,
      include: {
        clase: { select: { nombre: true, materia: true, googleCourseId: true } },
      },
      orderBy: { fechaEntrega: "asc" },
    });

    return NextResponse.json({ tareas });
  } catch (err: any) {
    console.error("[GET /api/classroom/tareas]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

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
    const parsed = crearSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { claseId, titulo, descripcion, linkUrl, fechaEntrega, puntos } = parsed.data;

    // Obtener la clase para el googleCourseId
    const clase = await db.classroomClase.findUnique({ where: { id: claseId } });
    if (!clase) {
      return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 });
    }

    // Verificar token de Classroom
    const token = await db.classroomToken.findUnique({
      where: { usuarioId: session.user.id },
    });

    let googleWorkId: string | undefined;

    // Si hay token, crear también en Google Classroom
    if (token) {
      try {
        const gWork = await crearTarea(session.user.id, clase.googleCourseId, {
          titulo,
          descripcion,
          linkUrl:      linkUrl || undefined,
          fechaEntrega: fechaEntrega ? new Date(fechaEntrega) : undefined,
          puntos,
        });
        googleWorkId = gWork.id;
      } catch (err) {
        // No bloquear si falla Google — guardar igual en BD local
        console.warn("[POST tareas] No se pudo crear en Google:", err);
      }
    }

    const tarea = await db.classroomTarea.create({
      data: {
        claseId,
        titulo,
        descripcion:   descripcion ?? null,
        linkUrl:       linkUrl || null,
        fechaEntrega:  fechaEntrega ? new Date(fechaEntrega) : null,
        puntosPosibles: puntos ?? null,
        googleWorkId:  googleWorkId ?? null,
        estado:        "ASIGNADA",
      },
    });

    return NextResponse.json({ tarea }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/classroom/tareas]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}