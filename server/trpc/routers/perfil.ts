// server/trpc/routers/perfil.ts
//
// Router de "Mi Perfil" para los roles ESTUDIANTE, DOCENTE y ADMIN.
// El rol DEVELOPER NO usa este router: tiene su propio flujo en
// /api/developer/perfil/* porque se autentica con un token Bearer
// independiente de la sesión de NextAuth (ver lib/developer-guard.ts
// y lib/developer-auth.ts). Por eso queda "siempre por fuera".
//
// ⚠️ Ajusta el import de abajo a como se llamen realmente "router" y
// "protectedProcedure" en tu server/trpc/trpc.ts (no tuve ese archivo
// a la vista, pero el patrón debería ser el mismo que usan tus otros
// routers como auth.ts, simulacro.ts o admin.ts).

import { z } from "zod";
import { compare, hash } from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { db } from "@/lib/db";
import { router, protectedProcedure } from "../trpc";

const actualizarPerfilSchema = z.object({
  nombre: z.string().min(2).max(100).optional(),
  imagen: z.string().url().nullable().optional(),
  documento: z.string().max(30).nullable().optional(),
  telefono: z.string().max(20).nullable().optional(),
  departamento: z.string().max(60).nullable().optional(),
  municipio: z.string().max(60).nullable().optional(),
  ciudad: z.string().max(60).nullable().optional(),
  colegio: z.string().max(120).nullable().optional(),
  grado: z.number().int().min(1).max(13).nullable().optional(),
});

const cambiarPasswordSchema = z.object({
  passwordActual: z.string().min(1, "Ingresa tu contraseña actual"),
  passwordNuevo: z
    .string()
    .min(8, "La nueva contraseña debe tener al menos 8 caracteres")
    .max(72),
});

export const perfilRouter = router({
  /** Devuelve los datos del usuario autenticado (nunca el passwordHash) */
  obtener: protectedProcedure.query(async ({ ctx }) => {
    const usuario = await db.usuario.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        nombre: true,
        email: true,
        imagen: true,
        rol: true,
        documento: true,
        telefono: true,
        departamento: true,
        municipio: true,
        ciudad: true,
        colegio: true,
        grado: true,
        createdAt: true,
      },
    });

    if (!usuario) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Usuario no encontrado" });
    }

    return usuario;
  }),

  /** Actualiza los datos editables del perfil (no incluye email ni contraseña) */
  actualizar: protectedProcedure
    .input(actualizarPerfilSchema)
    .mutation(async ({ ctx, input }) => {
      const usuario = await db.usuario.update({
        where: { id: ctx.session.user.id },
        data: input,
        select: {
          id: true,
          nombre: true,
          imagen: true,
          documento: true,
          telefono: true,
          departamento: true,
          municipio: true,
          ciudad: true,
          colegio: true,
          grado: true,
        },
      });

      return usuario;
    }),

  /** Cambia la contraseña. Solo aplica a cuentas que tienen login por credenciales. */
  cambiarPassword: protectedProcedure
    .input(cambiarPasswordSchema)
    .mutation(async ({ ctx, input }) => {
      const usuario = await db.usuario.findUnique({
        where: { id: ctx.session.user.id },
      });

      if (!usuario?.passwordHash) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tu cuenta inició sesión con Google y no tiene una contraseña local",
        });
      }

      const esValida = await compare(input.passwordActual, usuario.passwordHash);
      if (!esValida) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Contraseña actual incorrecta" });
      }

      const nuevoHash = await hash(input.passwordNuevo, 10);
      await db.usuario.update({
        where: { id: usuario.id },
        data: { passwordHash: nuevoHash },
      });

      return { success: true };
    }),
});