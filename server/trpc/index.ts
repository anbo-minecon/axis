// server/trpc/index.ts
import { router } from "./router";
import { authRouter } from "./routers/auth";
import { simulacroRouter } from "./routers/simulacro";
import { suscripcionRouter } from "./routers/suscripcion";
import { adminRouter } from "./routers/admin";
import { perfilRouter } from "./routers/perfil";

/**
 * Este es el router principal de tRPC
 * Todas las rutas se organizan aquí por dominio
 */
export const appRouter = router({
  auth: authRouter,
  simulacro: simulacroRouter,
  suscripcion: suscripcionRouter,
  admin: adminRouter,
  perfil: perfilRouter,
});

// Exportar tipo del router para el cliente
export type AppRouter = typeof appRouter;
