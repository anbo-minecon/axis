import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateDeveloper } from "@/lib/developer-guard";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET() {
  const developer = await authenticateDeveloper();
  if (!developer) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    return NextResponse.json({
      id: developer.id,
      nombre: developer.nombre,
      email: developer.email,
      rol: developer.rol,
      createdAt: developer.createdAt.toISOString(),
      ultimoAcceso: developer.developerCred?.ultimoAcceso?.toISOString(),
    });
  } catch (error) {
    console.error("[GET /api/developer/perfil]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const developer = await authenticateDeveloper();
  if (!developer) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { nombre, currentPassword, newPassword, confirmPassword } = body;

    // Actualizar nombre
    if (nombre) {
      await (db as any).usuario.update({
        where: { id: developer.id },
        data: { nombre },
      });
    }

    // Cambiar contraseña si se proporciona
    if (newPassword && confirmPassword) {
      if (newPassword !== confirmPassword) {
        return NextResponse.json({ error: "Las contraseñas no coinciden" }, { status: 400 });
      }

      if (newPassword.length < 8) {
        return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 });
      }

      // Verificar contraseña actual
      const devCred = await (db as any).developerCredential.findUnique({
        where: { usuarioId: developer.id },
      });

      if (!devCred) {
        return NextResponse.json({ error: "Credenciales no encontradas" }, { status: 404 });
      }

      if (currentPassword) {
        const isValid = await bcrypt.compare(currentPassword, devCred.passwordHash);
        if (!isValid) {
          return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 400 });
        }
      }

      // Hashear nueva contraseña
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      await (db as any).developerCredential.update({
        where: { usuarioId: developer.id },
        data: { passwordHash: newPasswordHash },
      });
    }

    return NextResponse.json({ success: true, message: "Perfil actualizado" });
  } catch (error) {
    console.error("[PUT /api/developer/perfil]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
