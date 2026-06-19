// app/api/admin/suscripciones/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/* ── Guard de rol ── */
async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const user = await db.usuario.findUnique({
    where: { id: session.user.id },
    select: { rol: true },
  });
  return user?.rol === "ADMIN" ? session : null;
}

/* ── GET /api/admin/suscripciones ── */
export async function GET(req: NextRequest) {
  const session = await checkAdmin();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const filtro  = searchParams.get("filtro") ?? "todas";   // todas | sin-suscripcion | con-suscripcion | activas | expiradas
  const busqueda = searchParams.get("q") ?? "";
  const page    = parseInt(searchParams.get("page") ?? "1");
  const limit   = 20;
  const skip    = (page - 1) * limit;

  const now = new Date();

  /* Construir where para usuarios (ESTUDIANTES) */
  const usuarioWhere: Record<string, unknown> = { rol: "ESTUDIANTE" };

  if (busqueda) {
    usuarioWhere.OR = [
      { nombre:   { contains: busqueda, mode: "insensitive" } },
      { email:    { contains: busqueda, mode: "insensitive" } },
      { documento: { contains: busqueda, mode: "insensitive" } },
    ];
  }

  /* Obtener todos los estudiantes con su suscripción */
  const [estudiantes, totalEstudiantes] = await Promise.all([
    db.usuario.findMany({
      where: usuarioWhere,
      include: {
        suscripcion: {
          include: {
            plan: { select: { id: true, nombre: true, precio: true, duracionDias: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.usuario.count({ where: usuarioWhere }),
  ]);

  /* Transformar a formato compatible y aplicar filtro */
  let registros = estudiantes.map((u) => ({
    id: u.suscripcion?.id ?? `temp-${u.id}`,
    usuarioId: u.id,
    planId: u.suscripcion?.planId ?? null,
    fechaInicio: u.suscripcion?.fechaInicio ?? null,
    fechaFin: u.suscripcion?.fechaFin ?? null,
    activa: u.suscripcion?.activa ?? false,
    usuario: { id: u.id, nombre: u.nombre, email: u.email, documento: u.documento, imagen: u.imagen },
    plan: u.suscripcion?.plan ?? null,
    tieneSuscripcion: !!u.suscripcion,
  }));

  /* Aplicar filtro */
  if (filtro === "sin-suscripcion") {
    // Incluye: sin relación de suscripción O suscripción desactivada
    registros = registros.filter((r) => !r.tieneSuscripcion || !r.activa);
  } else if (filtro === "con-suscripcion") {
    registros = registros.filter((r) => r.tieneSuscripcion && r.activa);
  } else if (filtro === "activas") {
    registros = registros.filter((r) => r.tieneSuscripcion && r.activa && r.fechaFin && new Date(r.fechaFin) >= now);
  } else if (filtro === "expiradas") {
    registros = registros.filter((r) => r.tieneSuscripcion && r.activa && r.fechaFin && new Date(r.fechaFin) < now);
  }

  /* Contadores */
  const [totalSinSuscripcion, totalConSuscripcion, totalActivas, totalExpiradas] = await Promise.all([
    // Sin suscripción: sin relación O desactivadas
    db.usuario.count({
      where: {
        ...usuarioWhere,
        OR: [
          { suscripcion: null },
          { suscripcion: { activa: false } }
        ]
      }
    }),
    // Con suscripción: relación existe Y activa
    db.usuario.count({
      where: {
        ...usuarioWhere,
        suscripcion: {
          activa: true
        }
      }
    }),
    // Activas: dentro de vigencia
    db.suscripcion.count({ where: { usuario: usuarioWhere, activa: true, fechaFin: { gte: now } } }),
    // Expiradas: fecha pasada
    db.suscripcion.count({ where: { usuario: usuarioWhere, activa: true, fechaFin: { lt: now } } }),
  ]);

  return NextResponse.json({
    suscripciones: registros,
    pagination: { total: totalEstudiantes, page, limit, pages: Math.ceil(totalEstudiantes / limit) },
    contadores: { 
      todas: totalEstudiantes,
      sinSuscripcion: totalSinSuscripcion,
      conSuscripcion: totalConSuscripcion,
      activas: totalActivas,
      expiradas: totalExpiradas,
    },
  });
}

/* ── PATCH /api/admin/suscripciones ── */
export async function PATCH(req: NextRequest) {
  const session = await checkAdmin();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { id, accion, diasExtra } = body as {
    id: string;
    accion: "activar" | "desactivar" | "extender" | "rechazar";
    diasExtra?: number;
  };

  if (!id || !accion) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const suscripcion = await db.suscripcion.findUnique({ where: { id } });
  if (!suscripcion) {
    return NextResponse.json({ error: "Suscripción no encontrada" }, { status: 404 });
  }

  let data: Record<string, unknown> = {};

  if (accion === "activar") {
    data = { activa: true };
  } else if (accion === "desactivar") {
    data = { activa: false };
  } else if (accion === "rechazar") {
    // Eliminar la suscripción
    await db.suscripcion.delete({ where: { id } });
    // Limpiar planId del usuario
    await db.usuario.update({
      where: { id: suscripcion.usuarioId },
      data: { planId: null },
    });
    // Audit log
    try {
      await db.auditLog.create({
        data: {
          usuarioId: session.user.id,
          accion: "SUSCRIPCION_RECHAZAR",
          recurso: "suscripcion",
          recursoId: id,
          mensaje: JSON.stringify({ accion: "rechazar" }),
          resultado: "EXITOSO",
        },
      });
    } catch { /* no bloquear si falla el log */ }
    return NextResponse.json({ ok: true, message: "Suscripción rechazada y eliminada" });
  } else if (accion === "extender") {
    if (!diasExtra || diasExtra <= 0) {
      return NextResponse.json({ error: "diasExtra inválido" }, { status: 400 });
    }
    const base = suscripcion.fechaFin > new Date() ? suscripcion.fechaFin : new Date();
    const nuevaFecha = new Date(base);
    nuevaFecha.setDate(nuevaFecha.getDate() + diasExtra);
    data = { fechaFin: nuevaFecha, activa: true };
  }

  const updated = await db.suscripcion.update({ where: { id }, data });

  /* Audit log */
  try {
    await db.auditLog.create({
      data: {
        usuarioId: session.user.id,
        accion: `SUSCRIPCION_${accion.toUpperCase()}`,
        recurso: "suscripcion",
        recursoId: id,
        mensaje: JSON.stringify({ accion, diasExtra }),
        resultado: "EXITOSO",
      },
    });
  } catch { /* no bloquear si falla el log */ }

  return NextResponse.json({ ok: true, suscripcion: updated });
}

/* ── POST /api/admin/suscripciones ── */
export async function POST(req: NextRequest) {
  const session = await checkAdmin();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { usuarioId, planId, diasDuracion } = body as {
    usuarioId: string;
    planId: string;
    diasDuracion: number;
  };

  if (!usuarioId || !planId || !diasDuracion) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  /* Validar que el usuario existe y es estudiante */
  const usuario = await db.usuario.findUnique({
    where: { id: usuarioId },
    select: { id: true, rol: true, suscripcion: true },
  });

  if (!usuario) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  if (usuario.rol !== "ESTUDIANTE") {
    return NextResponse.json({ error: "Solo se pueden crear suscripciones para estudiantes" }, { status: 400 });
  }

  // Si el usuario ya tiene una suscripción desactivada, eliminarla para crear una nueva
  if (usuario.suscripcion && !usuario.suscripcion.activa) {
    await db.suscripcion.delete({ where: { id: usuario.suscripcion.id } });
  } else if (usuario.suscripcion && usuario.suscripcion.activa) {
    return NextResponse.json({ error: "El usuario ya tiene una suscripción activa" }, { status: 400 });
  }

  /* Validar que el plan existe */
  const plan = await db.plan.findUnique({
    where: { id: planId },
    select: { id: true, activo: true },
  });

  if (!plan || !plan.activo) {
    return NextResponse.json({ error: "Plan no válido o inactivo" }, { status: 404 });
  }

  /* Crear la suscripción */
  const ahora = new Date();
  const fechaFin = new Date(ahora);
  fechaFin.setDate(fechaFin.getDate() + diasDuracion);

  const suscripcion = await db.suscripcion.create({
    data: {
      usuarioId,
      planId,
      fechaInicio: ahora,
      fechaFin,
      activa: true,
    },
    include: {
      usuario: { select: { id: true, nombre: true, email: true, documento: true, imagen: true } },
      plan: { select: { id: true, nombre: true, precio: true, duracionDias: true } },
    },
  });

  /* Audit log */
  try {
    await db.auditLog.create({
      data: {
        usuarioId: session.user.id,
        accion: "SUSCRIPCION_CREAR",
        recurso: "suscripcion",
        recursoId: suscripcion.id,
        mensaje: JSON.stringify({ usuarioId, planId, diasDuracion }),
        resultado: "EXITOSO",
      },
    });
  } catch { /* no bloquear si falla el log */ }

  return NextResponse.json({ ok: true, suscripcion });
}