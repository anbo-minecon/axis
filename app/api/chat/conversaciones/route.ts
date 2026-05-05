// app/api/chat/conversaciones/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const ROLES_STAFF = ["ADMIN", "DOCENTE"];

// ── GET — listar conversaciones del usuario actual ────────────────────────
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const userId = session.user.id;

    const conversaciones = await (db as any).conversacion.findMany({
      where: {
        OR: [
          { participanteAId: userId },
          { participanteBId: userId },
        ],
      },
      include: {
        participanteA: { select: { id: true, nombre: true, imagen: true, rol: true } },
        participanteB: { select: { id: true, nombre: true, imagen: true, rol: true } },
        mensajes: {
          orderBy: { creadoEn: "desc" },
          take: 1,
          select: { contenido: true, creadoEn: true, remitenteId: true },
        },
      },
      orderBy: { ultimoMensajeEn: "desc" },
    });

    // Formatear: el "otro" participante desde la perspectiva del usuario actual
    const data = conversaciones.map((c: any) => {
      const esA   = c.participanteAId === userId;
      const otro  = esA ? c.participanteB : c.participanteA;
      const noLeidos = esA ? c.noLeidosA : c.noLeidosB;

      return {
        id: c.id,
        otro: { id: otro.id, nombre: otro.nombre, imagen: otro.imagen, rol: otro.rol },
        ultimoMensaje: c.ultimoMensaje,
        ultimoMensajeEn: c.ultimoMensajeEn,
        noLeidos,
      };
    });

    return NextResponse.json({ conversaciones: data });
  } catch (e) {
    console.error("[GET /api/chat/conversaciones]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// ── POST — crear o recuperar conversación con otro usuario ────────────────
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { destinatarioId } = await req.json();
    if (!destinatarioId) return NextResponse.json({ error: "destinatarioId requerido" }, { status: 400 });

    const userId = session.user.id;
    if (userId === destinatarioId) return NextResponse.json({ error: "No puedes chatear contigo mismo" }, { status: 400 });

    // Obtener ambos usuarios
    const [yo, otro] = await Promise.all([
      db.usuario.findUnique({ where: { id: userId },         select: { rol: true } }),
      db.usuario.findUnique({ where: { id: destinatarioId }, select: { rol: true } }),
    ]);

    if (!yo || !otro) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    // Reglas de acceso:
    // - Estudiante solo puede hablar con ADMIN o DOCENTE
    // - ADMIN y DOCENTE pueden hablar con cualquiera
    if (yo.rol === "ESTUDIANTE" && !ROLES_STAFF.includes(otro.rol)) {
      return NextResponse.json({ error: "Los estudiantes solo pueden chatear con admins o docentes" }, { status: 403 });
    }

    // Buscar conversación existente (el unique es [A,B] — hay que buscar ambas combinaciones)
    const [idA, idB] = [userId, destinatarioId].sort(); // orden consistente
    
    const existente = await (db as any).conversacion.findFirst({
      where: {
        OR: [
          { participanteAId: userId,         participanteBId: destinatarioId },
          { participanteAId: destinatarioId, participanteBId: userId },
        ],
      },
    });

    if (existente) return NextResponse.json({ conversacionId: existente.id });

    // Crear nueva
    const nueva = await (db as any).conversacion.create({
      data: {
        participanteAId: idA,
        participanteBId: idB,
      },
    });

    return NextResponse.json({ conversacionId: nueva.id }, { status: 201 });
  } catch (e) {
    console.error("[POST /api/chat/conversaciones]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
