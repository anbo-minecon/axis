// app/api/classroom/clases/route.ts
// GET  — lista clases (desde BD + sincroniza con Google)
// POST — crea clase en Google y la guarda en BD

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { listarCursos, crearCurso } from "@/lib/classroom-client";
import { z } from "zod";

const crearClaseSchema = z.object({
  nombre:      z.string().min(3).max(100),
  descripcion: z.string().max(500).optional(),
  seccion:     z.string().max(100).optional(),
  materia:     z.string().max(100).optional(),
  grupoId:     z.string().optional(),
});

// ── GET: Listar clases ────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const rol = session.user.rol;

    // Estudiantes ven clases de su grupo
    if (rol === "ESTUDIANTE") {
      const usuario = await db.usuario.findUnique({
        where: { id: session.user.id },
        select: { grupoId: true },
      });

      const clases = await db.classroomClase.findMany({
        where: {
          grupoId: usuario?.grupoId ?? undefined,
          estado:  "ACTIVA",
        },
        include: {
          docente:     { select: { nombre: true, imagen: true } },
          _count:      { select: { grabaciones: true, tareas: true } },
        },
        orderBy: { updatedAt: "desc" },
      });

      return NextResponse.json({ clases });
    }

    // Admin/Docente ven todas sus clases
    const where = rol === "DOCENTE"
      ? { docenteId: session.user.id }
      : {};

    const clases = await db.classroomClase.findMany({
      where,
      include: {
        docente:  { select: { nombre: true, imagen: true } },
        grupo:    { select: { nombre: true } },
        _count:   { select: { grabaciones: true, tareas: true, eventos: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ clases });
  } catch (err: any) {
    console.error("[GET /api/classroom/clases]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// ── POST: Crear clase ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    if (session.user.rol !== "ADMIN") {
      return NextResponse.json({ error: "Solo el administrador puede crear clases" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = crearClaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { nombre, descripcion, seccion, materia, grupoId } = parsed.data;

    // Verificar que tiene token de Classroom
    const token = await db.classroomToken.findUnique({
      where: { usuarioId: session.user.id },
    });
    if (!token) {
      return NextResponse.json(
        { error: "Debes conectar tu cuenta de Google Classroom primero", code: "NO_CLASSROOM_TOKEN" },
        { status: 400 }
      );
    }

    // Crear en Google Classroom
    const gCourse = await crearCurso(session.user.id, nombre, seccion, descripcion);

    // Guardar en BD
    const clase = await db.classroomClase.create({
      data: {
        googleCourseId:    gCourse.id,
        nombre,
        descripcion:       descripcion ?? null,
        seccion:           seccion ?? null,
        materia:           materia ?? null,
        enlaceAlternativo: gCourse.alternateLink,
        estado:            "ACTIVA",
        docenteId:         session.user.id,
        grupoId:           grupoId ?? null,
      },
    });

    await db.auditLog.create({
      data: {
        usuarioId: session.user.id,
        accion:    "CREAR_CLASE_CLASSROOM",
        recurso:   "classroom_clase",
        recursoId: clase.id,
        resultado: "EXITOSO",
        mensaje:   `Clase "${nombre}" creada en Google Classroom`,
      },
    }).catch(() => {});

    return NextResponse.json({ clase, gCourse }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/classroom/clases]", err);
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 });
  }
}