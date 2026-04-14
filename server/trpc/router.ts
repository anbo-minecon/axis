// server/trpc/router.ts
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { type Context } from "./context";

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;

/** Procedimiento protegido - requiere sesión activa */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, session: ctx.session } });
});

/** Procedimiento con verificación de suscripción activa */
export const subscribedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Debes estar autenticado",
    });
  }

  // Verificar si la suscripción está activa
  if (!ctx.session.user.tieneSubscripcion) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Necesitas una suscripción activa para acceder a esta función",
    });
  }

  return next({ ctx: { ...ctx, session: ctx.session } });
});
