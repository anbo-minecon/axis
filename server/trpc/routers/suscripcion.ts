// server/trpc/routers/suscripcion.ts
import { router, protectedProcedure, subscribedProcedure } from "../router";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

/**
 * Router para manejar operaciones relacionadas con suscripciones
 * Este router gestiona el acceso a funciones premium
 */
export const suscripcionRouter = router({
  /**
   * Obtener estado actual de suscripción
   */
  obtenerEstado: protectedProcedure
    .query(async ({ ctx }) => {
      const suscripcion = await ctx.db.suscripcion.findUnique({
        where: { usuarioId: ctx.session.user.id },
        include: { plan: true },
      });

      if (!suscripcion) {
        return {
          activa: false,
          plan: null,
          diasRestantes: 0,
          tieneAccesoPremium: false,
          accesibleSin: [
            "notificaciones",
            "ranking",
            "materialEstudio", // documentos y videos (futuro)
            "perfil",
          ],
        };
      }

      const ahora = new Date();
      const activa = suscripcion.activa && suscripcion.fechaFin > ahora;

      if (!activa && suscripcion.activa) {
        // Marcar como inactiva si expiró
        await ctx.db.suscripcion.update({
          where: { id: suscripcion.id },
          data: { activa: false },
        });
      }

      const diasRestantes = Math.ceil(
        (suscripcion.fechaFin.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        activa: activa && diasRestantes > 0,
        plan: {
          id: suscripcion.plan.id,
          nombre: suscripcion.plan.nombre,
          descripcion: suscripcion.plan.descripcion,
          precio: suscripcion.plan.precio,
        },
        suscripcionId: suscripcion.id,
        fechaInicio: suscripcion.fechaInicio,
        fechaFin: suscripcion.fechaFin,
        diasRestantes: Math.max(0, diasRestantes),
        tieneAccesoPremium: activa && diasRestantes > 0,
        porcentajeUso: 0, // simulacros_completados / plan.simulacrosMax * 100
        accesibleSin: [
          "notificaciones",
          "ranking",
          "materialEstudio",
          "perfil",
        ],
      };
    }),

  /**
   * Verificar si tiene acceso a una función específica
   */
  verificarAcceso: protectedProcedure
    .input(z.enum(["simulacros", "estadisticas", "grupo", "materialAvanzado"]))
    .query(async ({ ctx, input }) => {
      const suscripcion = await ctx.db.suscripcion.findUnique({
        where: { usuarioId: ctx.session.user.id },
      });

      const activa = suscripcion?.activa ?? false;

      // Funciones permitidas sin suscripción
      const funcionesLibres = ["notificaciones", "ranking", "materialEstudio", "perfil"];
      const permitida = funcionesLibres.includes(input) || activa;

      return {
        accesoPermitido: permitida,
        funcionalidad: input,
        requierePago: !funcionesLibres.includes(input),
        mensaje: permitida
          ? "Acceso permitido"
          : `Necesitas una suscripción activa para acceder a ${input}`,
      };
    }),

  /**
   * Obtener planes disponibles para compra (publico)
   */
  obtenerPlanes: protectedProcedure
    .query(async ({ ctx }) => {
      const planes = await ctx.db.plan.findMany({
        where: { activo: true },
        orderBy: { precio: "asc" },
      });

      return planes.map((plan) => ({
        id: plan.id,
        nombre: plan.nombre,
        descripcion: plan.descripcion,
        precio: plan.precio,
        duracionDias: plan.duracionDias,
        simulacrosMax: plan.simulacrosMax === -1 ? "Ilimitados" : plan.simulacrosMax,
        caracteristicas: plan.caracteristicas,
      }));
    }),

  /**
   * [ADMIN] Activar suscripción para un usuario
   * Solo accesible por administradores
   */
  activarSuscripcion: protectedProcedure
    .input(z.object({
      usuarioId: z.string(),
      planId: z.string(),
      duracionDias: z.number().positive().optional(), // si no se especifica, usa la del plan
    }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Verificar que ctx.session.user sea ADMIN
      // TODO: Lógica para activar suscripción

      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Solo administradores pueden activar suscripciones",
      });
    }),
});
