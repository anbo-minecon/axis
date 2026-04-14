// lib/suscripcion-utils.ts
import { db } from "./db";
import { TRPCError } from "@trpc/server";

/**
 * Verifica si un usuario tiene suscripción activa
 */
export async function verificarSuscripcionActiva(usuarioId: string): Promise<boolean> {
  const suscripcion = await db.suscripcion.findUnique({
    where: { usuarioId },
  });

  if (!suscripcion) return false;

  // Verificar que no haya expirado
  const ahora = new Date();
  const vigente = suscripcion.fechaFin > ahora;

  // Si expiró, actualizar el estado
  if (suscripcion.activa && !vigente) {
    await db.suscripcion.update({
      where: { id: suscripcion.id },
      data: { activa: false },
    });
    return false;
  }

  return suscripcion.activa && vigente;
}

/**
 * Obtiene los detalles de suscripción de un usuario
 */
export async function obtenerDetallesSuscripcion(usuarioId: string) {
  const suscripcion = await db.suscripcion.findUnique({
    where: { usuarioId },
    include: {
      plan: true,
      usuario: {
        select: {
          id: true,
          nombre: true,
          email: true,
        },
      },
    },
  });

  if (!suscripcion) {
    return null;
  }

  const ahora = new Date();
  const vigente = suscripcion.fechaFin > ahora;
  const diasRestantes = Math.ceil(
    (suscripcion.fechaFin.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    id: suscripcion.id,
    usuario: suscripcion.usuario,
    plan: suscripcion.plan,
    fechaInicio: suscripcion.fechaInicio,
    fechaFin: suscripcion.fechaFin,
    activa: suscripcion.activa && vigente,
    diasRestantes: Math.max(0, diasRestantes),
    porcentajeVigencia: Math.round((diasRestantes / suscripcion.plan.duracionDias) * 100),
  };
}

/**
 * Crea una nueva suscripción para un usuario
 * Solo debe ser llamado por administratores
 */
export async function crearSuscripcion(
  usuarioId: string,
  planId: string,
  duracionDias?: number
) {
  // Verificar que el usuario existe
  const usuario = await db.usuario.findUnique({
    where: { id: usuarioId },
  });

  if (!usuario) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Usuario no encontrado",
    });
  }

  // Obtener el plan
  const plan = await db.plan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Plan no encontrado",
    });
  }

  // Si existe una suscripción anterior, eliminarla
  const suscripcionAnterior = await db.suscripcion.findUnique({
    where: { usuarioId },
  });

  if (suscripcionAnterior) {
    await db.suscripcion.delete({
      where: { id: suscripcionAnterior.id },
    });
  }

  // Crear nueva suscripción
  const dias = duracionDias || plan.duracionDias;
  const fechaFin = new Date();
  fechaFin.setDate(fechaFin.getDate() + dias);

  const suscripcion = await db.suscripcion.create({
    data: {
      usuarioId,
      planId,
      fechaFin,
      activa: true,
    },
    include: { plan: true },
  });

  // Actualizar planId del usuario para compatibilidad
  await db.usuario.update({
    where: { id: usuarioId },
    data: { planId },
  });

  return suscripcion;
}

/**
 * Revoca una suscripción de usuario
 */
export async function revocarSuscripcion(usuarioId: string) {
  const suscripcion = await db.suscripcion.findUnique({
    where: { usuarioId },
  });

  if (!suscripcion) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "No hay suscripción activa para este usuario",
    });
  }

  await db.suscripcion.update({
    where: { id: suscripcion.id },
    data: { activa: false },
  });

  // Limpiar planId del usuario
  await db.usuario.update({
    where: { id: usuarioId },
    data: { planId: null },
  });

  return { success: true };
}

/**
 * Obtiene el listado de funcionalidades permitidas según suscripción
 */
export function obtenerFuncionalidadesPermitidas(tieneSubscripcion: boolean) {
  const funcionesGratis = [
    "verPerfil",
    "editarPerfil",
    "verNotificaciones",
    "verRanking",
    "verMaterialEstudio", // Documentos y videos (implementar después)
    "verPlanes",
  ];

  const funcionesPremium = [
    "realizarSimulacro",
    "verResultados",
    "verEstadisticas",
    "unirseGrupo",
    "crearGrupo",
    "competir",
  ];

  return {
    permitidas: tieneSubscripcion
      ? [...funcionesGratis, ...funcionesPremium]
      : funcionesGratis,
    bloqueadas: tieneSubscripcion ? [] : funcionesPremium,
  };
}
