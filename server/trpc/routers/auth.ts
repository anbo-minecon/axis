// server/trpc/routers/auth.ts
import { router, publicProcedure, protectedProcedure } from "../router";
import { z } from "zod";
import { hash, compare } from "bcryptjs";
import { TRPCError } from "@trpc/server";

// Esquemas de validación
const registroSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  confirmPassword: z.string(),
  colegio: z.string().optional(),
  grado: z.number().min(9).max(11).optional(),
  ciudad: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authRouter = router({
  /**
   * Registrar nuevo estudiante
   * El usuario se crea sin suscripción (acceso limitado)
   */
  registro: publicProcedure
    .input(registroSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Validar que el email no exista
        const usuarioExistente = await ctx.db.usuario.findUnique({
          where: { email: input.email },
        });

        if (usuarioExistente) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "El email ya está registrado",
          });
        }

        // Hashear contraseña
        const passwordHash = await hash(input.password, 12);

        // Crear usuario nuevo
        const usuario = await ctx.db.usuario.create({
          data: {
            nombre: input.nombre,
            email: input.email,
            passwordHash,
            colegio: input.colegio,
            grado: input.grado,
            ciudad: input.ciudad,
            rol: "ESTUDIANTE",
            // Por defecto sin plan ni suscripción
          },
        });

        return {
          success: true,
          userId: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre,
          message: "Registro exitoso. Ahora puedes iniciar sesión",
        };
      } catch (error) {
        console.error("❌ Error en registro:", error);
        if (error instanceof TRPCError) throw error;
        
        // Log adicional del error para debugging
        if (error instanceof Error) {
          console.error("Error message:", error.message);
          console.error("Error stack:", error.stack);
        }
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error al registrar usuario: " + (error instanceof Error ? error.message : "Desconocido"),
        });
      }
    }),

  /**
   * Obtener perfil del usuario autenticado
   * Incluye información de suscripción
   */
  obtenerPerfil: protectedProcedure
    .query(async ({ ctx }) => {
      const usuario = await ctx.db.usuario.findUnique({
        where: { id: ctx.session.user.id },
        include: {
          suscripcion: {
            include: { plan: true },
          },
          plan: true,
        },
      });

      if (!usuario) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuario no encontrado",
        });
      }

      return {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        imagen: usuario.imagen,
        rol: usuario.rol,
        colegio: usuario.colegio,
        grado: usuario.grado,
        ciudad: usuario.ciudad,
        tieneSubscripcion: usuario.suscripcion?.activa ?? false,
        suscripcion: usuario.suscripcion
          ? {
              id: usuario.suscripcion.id,
              planNombre: usuario.suscripcion.plan.nombre,
              fechaInicio: usuario.suscripcion.fechaInicio,
              fechaFin: usuario.suscripcion.fechaFin,
              activa: usuario.suscripcion.activa,
              diasRestantes: Math.ceil(
                (usuario.suscripcion.fechaFin.getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24)
              ),
            }
          : null,
        createdAt: usuario.createdAt,
      };
    }),

  /**
   * Verificar si el usuario tiene acceso a simulacros
   * Solo usuarios con suscripción activa
   */
  verificarAccesoSimulacros: protectedProcedure
    .query(async ({ ctx }) => {
      const suscripcion = await ctx.db.suscripcion.findUnique({
        where: { usuarioId: ctx.session.user.id },
        include: { plan: true },
      });

      const activa = suscripcion?.activa ?? false;

      return {
        tieneAcceso: activa,
        estudiante: true,
        razonBloqueo: activa ? null : "Necesitas un plan pagado para acceder a simulacros",
      };
    }),

  /**
   * Actualizar perfil del usuario
   */
  actualizarPerfil: protectedProcedure
    .input(z.object({
      nombre: z.string().min(2).optional(),
      colegio: z.string().optional(),
      grado: z.number().min(9).max(11).optional(),
      ciudad: z.string().optional(),
      imagen: z.string().url().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const usuario = await ctx.db.usuario.update({
        where: { id: ctx.session.user.id },
        data: {
          nombre: input.nombre,
          colegio: input.colegio,
          grado: input.grado,
          ciudad: input.ciudad,
          imagen: input.imagen,
        },
      });

      return {
        success: true,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          imagen: usuario.imagen,
          colegio: usuario.colegio,
          grado: usuario.grado,
          ciudad: usuario.ciudad,
        },
      };
    }),

  /**
   * Cambiar contraseña del usuario
   */
  cambiarContrasena: protectedProcedure
    .input(z.object({
      contrasenaActual: z.string(),
      contrasenaNueva: z.string().min(8),
      confirmarContrasena: z.string(),
    }).refine((data) => data.contrasenaNueva === data.confirmarContrasena, {
      message: "Las nuevas contraseñas no coinciden",
      path: ["confirmarContrasena"],
    }))
    .mutation(async ({ ctx, input }) => {
      const usuario = await ctx.db.usuario.findUnique({
        where: { id: ctx.session.user.id },
      });

      if (!usuario || !usuario.passwordHash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuario no encontrado",
        });
      }

      // Verificar contraseña actual
      const validPassword = await compare(input.contrasenaActual, usuario.passwordHash);
      if (!validPassword) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Contraseña actual incorrecta",
        });
      }

      // Hashear nueva contraseña
      const newPasswordHash = await hash(input.contrasenaNueva, 12);

      await ctx.db.usuario.update({
        where: { id: ctx.session.user.id },
        data: { passwordHash: newPasswordHash },
      });

      return {
        success: true,
        message: "Contraseña actualizada correctamente",
      };
    }),
});
