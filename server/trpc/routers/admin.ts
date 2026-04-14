// server/trpc/routers/admin.ts
import { router, protectedProcedure } from "../router";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  crearSuscripcion,
  revocarSuscripcion,
  obtenerDetallesSuscripcion,
} from "@/lib/suscripcion-utils";

/**
 * Middleware para verificar acceso de administrador
 */
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  // TODO: Implementar verificación de rol ADMIN
  const usuario = await ctx.db.usuario.findUnique({
    where: { id: ctx.session.user.id },
  });

  if (!usuario || usuario.rol !== "ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Solo administradores tienen acceso",
    });
  }

  return next({ ctx: { ...ctx, session: ctx.session } });
});

export const adminRouter = router({
  /**
   * Crear o activar una nueva suscripción para un usuario
   */
  activarSuscripcion: adminProcedure
    .input(z.object({
      usuarioId: z.string(),
      planId: z.string(),
      duracionDias: z.number().positive().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const suscripcion = await crearSuscripcion(
          input.usuarioId,
          input.planId,
          input.duracionDias
        );

        return {
          success: true,
          suscripcion: {
            id: suscripcion.id,
            usuarioId: input.usuarioId,
            plan: suscripcion.plan.nombre,
            fechaFin: suscripcion.fechaFin,
            activa: true,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error al activar suscripción",
        });
      }
    }),

  /**
   * Desactivar suscripción de un usuario
   */
  desactivarSuscripcion: adminProcedure
    .input(z.object({ usuarioId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await revocarSuscripcion(input.usuarioId);
        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error al desactivar suscripción",
        });
      }
    }),

  /**
   * Obtener detalles de suscripción de un usuario
   */
  obtenerSuscripcion: adminProcedure
    .input(z.object({ usuarioId: z.string() }))
    .query(async ({ ctx, input }) => {
      const detalles = await obtenerDetallesSuscripcion(input.usuarioId);

      if (!detalles) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuario no tiene suscripción",
        });
      }

      return detalles;
    }),

  /**
   * Listar todos los planes disponibles
   */
  listarPlanes: adminProcedure
    .query(async ({ ctx }) => {
      const planes = await ctx.db.plan.findMany({
        orderBy: { precio: "asc" },
      });

      return planes;
    }),

  /**
   * Crear nuevo plan
   */
  crearPlan: adminProcedure
    .input(z.object({
      nombre: z.string().min(3),
      descripcion: z.string().optional(),
      precio: z.number().min(0),
      duracionDias: z.number().positive(),
      simulacrosMax: z.number().default(-1),
      caracteristicas: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const plan = await ctx.db.plan.create({
          data: {
            nombre: input.nombre,
            descripcion: input.descripcion,
            precio: input.precio,
            duracionDias: input.duracionDias,
            simulacrosMax: input.simulacrosMax,
            caracteristicas: input.caracteristicas,
          },
        });

        return {
          success: true,
          plan,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error al crear plan",
        });
      }
    }),

  /**
   * Actualizar plan
   */
  actualizarPlan: adminProcedure
    .input(z.object({
      planId: z.string(),
      nombre: z.string().optional(),
      descripcion: z.string().optional(),
      precio: z.number().optional(),
      duracionDias: z.number().optional(),
      simulacrosMax: z.number().optional(),
      caracteristicas: z.array(z.string()).optional(),
      activo: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const plan = await ctx.db.plan.update({
          where: { id: input.planId },
          data: {
            nombre: input.nombre,
            descripcion: input.descripcion,
            precio: input.precio,
            duracionDias: input.duracionDias,
            simulacrosMax: input.simulacrosMax,
            caracteristicas: input.caracteristicas,
            activo: input.activo,
          },
        });

        return {
          success: true,
          plan,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error al actualizar plan",
        });
      }
    }),

  /**
   * Listar todos los usuarios
   */
  listarUsuarios: adminProcedure
    .input(z.object({
      rol: z.enum(["ESTUDIANTE", "DOCENTE", "ADMIN"]).optional(),
      conSuscripcion: z.boolean().optional(),
      skip: z.number().default(0),
      take: z.number().default(50),
    }))
    .query(async ({ ctx, input }) => {
      const usuarios = await ctx.db.usuario.findMany({
        where: {
          rol: input.rol,
          // TODO: Filtrar por conSuscripcion
        },
        include: {
          suscripcion: {
            include: { plan: true },
          },
        },
        skip: input.skip,
        take: input.take,
        orderBy: { createdAt: "desc" },
      });

      return usuarios.map((u) => ({
        id: u.id,
        nombre: u.nombre,
        email: u.email,
        rol: u.rol,
        colegio: u.colegio,
        grado: u.grado,
        tieneSubscripcion: u.suscripcion?.activa ?? false,
        suscripcion: u.suscripcion
          ? {
              plan: u.suscripcion.plan.nombre,
              fechaFin: u.suscripcion.fechaFin,
            }
          : null,
        createdAt: u.createdAt,
      }));
    }),
});
