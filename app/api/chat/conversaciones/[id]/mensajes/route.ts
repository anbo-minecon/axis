// app/api/chat/conversaciones/[id]/mensajes/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { pusherServer } from "@/lib/pusher";

// ── GET — obtener mensajes de una conversación ──────────────────────────────
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const conversacionId = params.id;

    // Verificar que el usuario es parte de la conversación
    const conv = await (db as any).conversacion.findUnique({
      where: { id: conversacionId },
      select: { participanteAId: true, participanteBId: true },
    });

    if (!conv) return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 });

    const esParticipante = conv.participanteAId === session.user.id || conv.participanteBId === session.user.id;
    if (!esParticipante) return NextResponse.json({ error: "No tienes acceso a esta conversación" }, { status: 403 });

    // Obtener mensajes
    const mensajes = await (db as any).mensaje.findMany({
      where: { conversacionId },
      include: {
        remitente: { select: { id: true, nombre: true, imagen: true, rol: true } },
      },
      orderBy: { creadoEn: "asc" },
    });

    // Marcar como leídos si el usuario no es el remitente
    const esA = conv.participanteAId === session.user.id;
    await (db as any).conversacion.update({
      where: { id: conversacionId },
      data: {
        [esA ? "noLeidosA" : "noLeidosB"]: 0,
      },
    });

    return NextResponse.json({ mensajes });
  } catch (e) {
    console.error(`[GET /api/chat/conversaciones/[id]/mensajes]`, e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// ── POST — enviar un mensaje ───────────────────────────────────────────────
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { contenido } = await req.json();
    if (!contenido || typeof contenido !== "string" || !contenido.trim()) {
      return NextResponse.json({ error: "Contenido vacío" }, { status: 400 });
    }

    const conversacionId = params.id;

    // Verificar que la conversación existe y el usuario es parte de ella
    const conv = await (db as any).conversacion.findUnique({
      where: { id: conversacionId },
      select: { participanteAId: true, participanteBId: true },
    });

    if (!conv) return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 });

    const esParticipante = conv.participanteAId === session.user.id || conv.participanteBId === session.user.id;
    if (!esParticipante) return NextResponse.json({ error: "No tienes acceso a esta conversación" }, { status: 403 });

    // Crear mensaje
    const mensaje = await (db as any).mensaje.create({
      data: {
        conversacionId,
        remitenteId: session.user.id,
        contenido: contenido.trim(),
        creadoEn: new Date(),
      },
      include: {
        remitente: { select: { id: true, nombre: true, imagen: true, rol: true } },
      },
    });

    // Actualizar conversación
    const esA = conv.participanteAId === session.user.id;
    const otroId = esA ? conv.participanteBId : conv.participanteAId;
    
    await (db as any).conversacion.update({
      where: { id: conversacionId },
      data: {
        ultimoMensaje: contenido.substring(0, 100),
        ultimoMensajeEn: new Date(),
        [esA ? "noLeidosB" : "noLeidosA"]: { increment: 1 },
      },
    });

    // Notificar por Pusher
    await pusherServer.trigger(`usuario-${otroId}`, "nueva-notificacion", {
      conversacionId,
      mensaje: contenido.substring(0, 100),
    });

    return NextResponse.json({ mensaje }, { status: 201 });
  } catch (e) {
    console.error(`[POST /api/chat/conversaciones/[id]/mensajes]`, e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
