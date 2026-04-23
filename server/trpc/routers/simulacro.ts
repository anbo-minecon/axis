// server/trpc/routers/simulacro.ts
import { router, subscribedProcedure } from "../router";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

/**
 * Router para simulacros
 * IMPORTANTE: Solo usuarios con suscripción activa tienen acceso
 */
export const simulacroRouter = router({
  /**
   * Crear un nuevo simulacro
   * Solo disponible para usuarios con suscripción
   */
  crear: subscribedProcedure
    .input(z.object({
      tipo: z.enum(["COMPLETO", "POR_AREA", "PRACTICA_RAPIDA"]),
      areaId: z.string().optional(), // Si es POR_AREA
    }))
    .mutation(async ({ ctx, input }) => {
      // TODO: seleccionar preguntas del banco y crear simulacro
      // TODO: guardar en Redis para performance
      throw new TRPCError({
        code: "NOT_IMPLEMENTED",
        message: "Funcionalidad en desarrollo",
      });
    }),

  /**
   * Obtener un simulacro en progreso
   */
  obtener: subscribedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // TODO: retornar simulacro con preguntas (desde caché Redis)
      throw new TRPCError({
        code: "NOT_IMPLEMENTED",
        message: "Funcionalidad en desarrollo",
      });
    }),

  /**
   * Finalizar un simulacro y calcular puntaje
   */
  finalizar: subscribedProcedure
    .input(z.object({
      id: z.string(),
      respuestas: z.array(z.object({
        preguntaId: z.string(),
        opcionId: z.string().nullable(),
        tiempoSegundos: z.number(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      // TODO: calcular puntaje y guardar resultados
      // TODO: actualizar percentiles
      throw new TRPCError({
        code: "NOT_IMPLEMENTED",
        message: "Funcionalidad en desarrollo",
      });
    }),

  /**
   * Obtener historial de simulacros del usuario
   */
  obtenerHistorial: subscribedProcedure
    .query(async ({ ctx }) => {
      const simulacros = await ctx.db.simulacro.findMany({
        where: { usuarioId: ctx.session.user.id },
        orderBy: { fechaInicio: "desc" },
        include: {
          respuestas: {
            select: { esCorrecta: true },
          },
        },
      });

      return simulacros.map((s) => ({
        id: s.id,
        tipo: s.tipo,
        estado: s.estado,
        puntajeTotal: s.puntajeTotal ?? 0,
        fechaInicio: s.fechaInicio,
        fechaFin: s.fechaFin,
        duracionMinutos: s.duracionMin,
        correctas: s.respuestas.filter((r) => r.esCorrecta).length,
        total: s.respuestas.length,
      }));
    }),
});
