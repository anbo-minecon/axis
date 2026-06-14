// app/api/auth/completar-registro-google/route.ts
// Endpoint para completar el registro de usuarios que se registran por Google

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const completarRegistroSchema = z.object({
  nombre: z.string().min(3).max(100),
  email: z.string().email(),
  telefono: z.string().regex(/^\d{7,}$/),
  documento: z.string().max(50).nullable().optional(),
  colegio: z.string().max(100).nullable().optional(),
  grado: z.number().int().min(10).max(12).nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Validar que el usuario esté logueado por Google
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autenticado. Debes iniciar sesión con Google primero." },
        { status: 401 }
      );
    }

    // Validar que el usuario esté logueado por Google (no por credenciales)
    const usuario = await db.usuario.findUnique({
      where: { id: session.user.id },
    });

    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Parsear y validar datos
    const body = await req.json();
    const parsed = completarRegistroSchema.safeParse(body);

    if (!parsed.success) {
      const msgs = parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
      return NextResponse.json({ error: msgs[0] }, { status: 400 });
    }

    const { nombre, email, telefono, documento, colegio, grado } = parsed.data;

    // Validar que el email coincida con la sesión
    if (email !== session.user.email) {
      return NextResponse.json(
        { error: "El email no coincide con tu sesión" },
        { status: 400 }
      );
    }

    // Actualizar usuario con los datos completados
    const updated = await db.usuario.update({
      where: { id: session.user.id },
      data: {
        nombre,
        telefono,
        documento: documento || undefined,
        colegio: colegio || undefined,
        grado: grado || undefined,
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        telefono: true,
        documento: true,
        colegio: true,
        grado: true,
      },
    });

    // Log de auditoría
    try {
      await db.auditLog.create({
        data: {
          usuarioId: session.user.id,
          accion: "COMPLETAR_REGISTRO_GOOGLE",
          recurso: "usuario",
          recursoId: session.user.id,
          resultado: "EXITOSO",
          mensaje: `Usuario completó registro via Google: ${nombre}`,
        },
      });
    } catch {
      // No bloquear si falla el log
      console.warn("[audit] Error al registrar log de Google");
    }

    return NextResponse.json({
      ok: true,
      usuario: updated,
      mensaje: "Registro completado exitosamente",
    });
  } catch (error: any) {
    console.error("[POST /api/auth/completar-registro-google]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
