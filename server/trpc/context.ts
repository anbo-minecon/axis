// server/trpc/context.ts
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function createContext() {
  const session = await getServerSession(authOptions);
  return { db, session };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
