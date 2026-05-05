// app/api/chat/usuarios/route.ts
// Devuelve la lista de admins y docentes con quienes el estudiante puede chatear
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const yo = await db.usuario.findUnique({
      where: { id: session.user.id },
      select: { rol: true },
    });

    if (!yo) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    let whereRol: any = {};

    if (yo.rol === "ESTUDIANTE") {
      // Estudiante solo ve admins y docentes
      whereRol = { rol: { in: ["ADMIN", "DOCENTE"] } };
    } else {
      // Admin/Docente ve a todos excepto a sí mismo
      whereRol = { id: { not: session.user.id } };
    }

    const usuarios = await db.usuario.findMany({
      where: {
        ...whereRol,
        id: { not: session.user.id },
        rol: { not: "DEVELOPER" },
      },
      select: {
        id: true,
        nombre: true,
        imagen: true,
        rol: true,
        email: true,
      },
      orderBy: [{ rol: "asc" }, { nombre: "asc" }],
    });

    return NextResponse.json({ usuarios });
  } catch (e) {
    console.error("[GET /api/chat/usuarios]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}