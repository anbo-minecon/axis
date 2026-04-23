// lib/developer-guard.ts
import { headers } from "next/headers";
import { db } from "./db";

export async function authenticateDeveloper() {
  try {
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7);

    // Decodificar JWT (nota: verificación completa en producción)
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;

      const payload = JSON.parse(
        Buffer.from(parts[1], "base64url").toString()
      );

      const usuario = await db.usuario.findUnique({
        where: { id: payload.sub },
        include: { developerCred: true },
      });

      if (!usuario || usuario.rol !== "DEVELOPER" || !usuario.developerCred?.activo) {
        return null;
      }

      return usuario;
    } catch {
      return null;
    }
  } catch (error) {
    console.error("Error authenticating developer:", error);
    return null;
  }
}

export async function getDeveloperIpAddress(): Promise<string> {
  try {
    const headersList = await headers();
    const forwarded = headersList.get("x-forwarded-for");
    const ip =
      forwarded?.split(",")[0].trim() || headersList.get("x-real-ip") || "unknown";
    return ip;
  } catch {
    return "unknown";
  }
}
