// app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/trpc";
import { createContext } from "@/server/trpc/context";

/**
 * Handler HTTP para las rutas tRPC
 * Conecta las rutas HTTP con los procedimientos tRPC
 */
const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
    onError: ({ path, error }) => {
      console.error(`tRPC Error [${path}]`, error);
    },
  });

export { handler as GET, handler as POST };
