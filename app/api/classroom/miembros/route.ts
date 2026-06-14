// app/api/classroom/miembros/route.ts
// GET  — lista estudiantes de una clase (desde Google Classroom)
// POST — importa estudiantes al Grupo AXIS correspondiente

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { listarEstudiantes, invitarEstudiante } from "@/lib/classroom-client";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const rol = session.user.rol;
    if (rol !== "ADMIN" && rol !== "DOCENTE") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const claseId = searchParams.get("claseId");
    if (!claseId) {
      return NextResponse.json({ error: "claseId requerido" }, { status: 400 });
    }

    const clase = await db.classroomClase.findUnique({
      where: { id: claseId },
      include: {
        grupo: {
          include: {
            estudiantes: { select: { id: true, nombre: true, email: true, imagen: true } },
          },
        },
      },
    });

    if (!clase) {
      return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 });
    }

    // Traer estudiantes de Google Classroom
    let estudiantesGoogle: any[] = [];
    try {
      estudiantesGoogle = await listarEstudiantes(session.user.id, clase.googleCourseId);
    } catch (err) {
      console.warn("[miembros] No se pudo consultar Google:", err);
    }

    // Estudiantes en el Grupo AXIS
    const estudiantesAxis = clase.grupo?.estudiantes ?? [];

    // Cruzar: ver cuáles emails de Google están o no en AXIS
    const emailsAxis = new Set(estudiantesAxis.map((e: any) => e.email.toLowerCase()));
    const sincronizados = estudiantesGoogle.map((eg: any) => ({
      googleUserId:  eg.userId,
      nombre:        eg.profile.name.fullName,
      email:         eg.profile.emailAddress,
      foto:          eg.profile.photoUrl ?? null,
      enAxis:        emailsAxis.has(eg.profile.emailAddress.toLowerCase()),
    }));

    return NextResponse.json({
      estudiantesGoogle: sincronizados,
      estudiantesAxis,
      clase: { id: clase.id, nombre: clase.nombre, grupoId: clase.grupoId },
    });
  } catch (err: any) {
    console.error("[GET /api/classroom/miembros]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST — dos acciones según "accion":
// "importar"  → busca usuario en BD por email y lo asigna al grupo
// "invitar"   → invita email nuevo a Google Classroom
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    if (session.user.rol !== "ADMIN") {
      return NextResponse.json({ error: "Solo el administrador puede gestionar miembros" }, { status: 403 });
    }

    const body = await req.json();
    const { accion, claseId, email, usuarioId } = body;

    if (!claseId) {
      return NextResponse.json({ error: "claseId requerido" }, { status: 400 });
    }

    const clase = await db.classroomClase.findUnique({ where: { id: claseId } });
    if (!clase) {
      return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 });
    }

    // ── Importar: asignar usuario AXIS existente al grupo ─────────────────────
    if (accion === "importar") {
      if (!email && !usuarioId) {
        return NextResponse.json({ error: "email o usuarioId requerido" }, { status: 400 });
      }

      const usuario = usuarioId
        ? await db.usuario.findUnique({ where: { id: usuarioId } })
        : await db.usuario.findUnique({ where: { email } });

      if (!usuario) {
        return NextResponse.json(
          { error: "Usuario no encontrado en AXIS. Debe registrarse primero." },
          { status: 404 }
        );
      }

      if (!clase.grupoId) {
        return NextResponse.json(
          { error: "La clase no tiene un Grupo AXIS asignado. Asigna uno primero." },
          { status: 400 }
        );
      }

      // Asignar grupo al usuario
      await db.usuario.update({
        where: { id: usuario.id },
        data:  { grupoId: clase.grupoId },
      });

      await db.auditLog.create({
        data: {
          usuarioId: session.user.id,
          accion:    "IMPORTAR_ESTUDIANTE_CLASSROOM",
          recurso:   "usuario",
          recursoId: usuario.id,
          resultado: "EXITOSO",
          mensaje:   `Estudiante ${usuario.email} importado al grupo ${clase.grupoId}`,
        },
      }).catch(() => {});

      return NextResponse.json({ ok: true, mensaje: `${usuario.nombre} asignado al grupo` });
    }

    // ── Invitar: enviar invitación de Google Classroom ────────────────────────
    if (accion === "invitar") {
      if (!email) {
        return NextResponse.json({ error: "email requerido para invitar" }, { status: 400 });
      }

      await invitarEstudiante(session.user.id, clase.googleCourseId, email);

      return NextResponse.json({ ok: true, mensaje: `Invitación enviada a ${email}` });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (err: any) {
    console.error("[POST /api/classroom/miembros]", err);
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 });
  }
}