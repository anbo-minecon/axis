// app/api/classroom/sync-miembros/route.ts
// POST — sincronizar miembros de una clase con Google Classroom
// Trae los estudiantes de Google Classroom y los crea/actualiza en la BD local

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { listarEstudiantes } from "@/lib/classroom-client";
import { z } from "zod";

const syncSchema = z.object({
  claseId: z.string().min(1, "claseId es requerido"),
});

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
    const parsed = syncSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { claseId } = parsed.data;

    // Obtener clase
    const clase = await db.classroomClase.findUnique({
      where: { id: claseId },
      include: {
        docente: { select: { id: true, nombre: true } },
        grupo:   { select: { id: true, nombre: true } },
      },
    });

    if (!clase) {
      return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 });
    }

    // Docente solo puede sincronizar sus clases
    if (rol === "DOCENTE" && clase.docenteId !== session.user.id) {
      return NextResponse.json({ error: "No tienes acceso a esta clase" }, { status: 403 });
    }

    // Verificar que la clase tiene vinculación con Google Classroom
    if (!clase.googleCourseId) {
      return NextResponse.json(
        { error: "Esta clase no está vinculada a un curso de Google Classroom" },
        { status: 400 }
      );
    }

    // Obtener docente y verificar que tiene token
    if (!clase.docenteId) {
      return NextResponse.json({ error: "La clase no tiene docente asignado" }, { status: 400 });
    }

    // Obtener estudiantes de Google Classroom
    let googleEstudiantes: any[] = [];
    try {
      googleEstudiantes = await listarEstudiantes(clase.docenteId, clase.googleCourseId);
    } catch (err: any) {
      console.error("[SYNC] Error al obtener estudiantes de Google:", err);
      return NextResponse.json(
        { error: `Error al conectar con Google Classroom: ${err.message}` },
        { status: 500 }
      );
    }

    // Procesar sincronización
    const results = {
      creados:     [] as any[],
      actualizados: [] as any[],
      vinculados:  [] as any[],
      errores:     [] as any[],
    };

    for (const gStudent of googleEstudiantes) {
      try {
        const email = gStudent.profile.emailAddress;
        const nombre = gStudent.profile.name.fullName;
        const googleId = gStudent.userId;

        // 1. Buscar usuario por email
        let usuario = await db.usuario.findUnique({
          where: { email },
          select: { id: true, nombre: true, grupoId: true },
        });

        // 2. Si no existe, crear usuario
        if (!usuario) {
          usuario = await db.usuario.create({
            data: {
              email,
              nombre,
              rol:     "ESTUDIANTE",
              grupoId: clase.grupoId,
              imagen:  gStudent.profile.photoUrl ?? null,
            },
            select: { id: true, nombre: true, grupoId: true },
          });

          results.creados.push({
            email,
            nombre,
            userId: usuario.id,
          });
        }

        // 3. Si existe pero no tiene grupoId, asignarlo
        if (!usuario.grupoId && clase.grupoId) {
          await db.usuario.update({
            where: { id: usuario.id },
            data:  { grupoId: clase.grupoId },
          });

          results.vinculados.push({
            email,
            userId: usuario.id,
          });
        }

        // 4. Guardar el googleId para referencia
        // (Si tienes un campo googleId en Usuario, actualizar aquí)

        results.actualizados.push({
          email,
          userId: usuario.id,
        });
      } catch (err: any) {
        results.errores.push({
          email: gStudent.profile.emailAddress,
          error: err.message,
        });
      }
    }

    // Audit log
    await db.auditLog
      .create({
        data: {
          usuarioId: session.user.id,
          accion:    "SYNC_MIEMBROS_CLASSROOM",
          recurso:   "classroom_clase",
          recursoId: claseId,
          resultado: "EXITOSO",
          mensaje:   `Sincronizados ${googleEstudiantes.length} estudiantes. Creados: ${results.creados.length}, Vinculados: ${results.vinculados.length}`,
        },
      })
      .catch(() => {});

    return NextResponse.json(
      {
        claseId,
        clase: {
          nombre:      clase.nombre,
          docente:     clase.docente.nombre,
          grupo:       clase.grupo?.nombre,
        },
        sincronizacion: {
          totalGoogleClassroom: googleEstudiantes.length,
          ...results,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[POST /api/classroom/sync-miembros]", err);
    return NextResponse.json(
      { error: err.message || "Error interno de sincronización" },
      { status: 500 }
    );
  }
}
