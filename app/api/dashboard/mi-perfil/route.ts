import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const body = await req.json();
    const { nombre, telefono, protegerDocumento } = body;

    await db.usuario.update({ where: { id: session.user.id }, data: { nombre: nombre ?? undefined, telefono: telefono ?? undefined, protegerDocumento: protegerDocumento ?? undefined } });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[POST /api/dashboard/mi-perfil]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
