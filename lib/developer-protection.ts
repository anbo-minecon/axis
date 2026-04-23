// lib/developer-protection.ts
/**
 * Utilidades para proteger el rol DEVELOPER
 * Aseguran que nunca sea expuesto, listado, editado o asignado desde interfaces públicas
 */

import { db } from "./db";
import { TRPCError } from "@trpc/server";

/**
 * Filtra resultados de usuarios para excluir DEVELOPER
 */
export function filterOutDevelopers<T extends { rol?: string }>(
  usuarios: T[]
): T[] {
  return usuarios.filter((u) => u.rol !== "DEVELOPER");
}

/**
 * Valida que no se intente asignar el rol DEVELOPER
 */
export function validateRoleAssignment(rol: string) {
  if (rol === "DEVELOPER") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "No puedes asignar este rol",
    });
  }
}

/**
 * Protege contra acceso a usuarios DEVELOPER
 */
export async function protectDeveloperAccess(usuarioId: string) {
  const usuario = await db.usuario.findUnique({
    where: { id: usuarioId },
  });

  if (usuario?.rol === "DEVELOPER") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Esta operación no está permitida",
    });
  }

  return usuario;
}

/**
 * Valida que solo Developers puedan acceder a rutas de Developer
 */
export async function requireDeveloperAccess(usuarioId: string) {
  const usuario = await db.usuario.findUnique({
    where: { id: usuarioId },
  });

  if (usuario?.rol !== "DEVELOPER") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Acceso denegado",
    });
  }

  return usuario;
}

/**
 * Enumera todos los roles públicos (sin incluir DEVELOPER)
 */
export const PUBLIC_ROLES = ["ESTUDIANTE", "DOCENTE", "ADMIN"] as const;
export type PublicRole = (typeof PUBLIC_ROLES)[number];

/**
 * Valida que un rol sea público y no DEVELOPER
 */
export function isPublicRole(rol: string): rol is PublicRole {
  return PUBLIC_ROLES.includes(rol as PublicRole);
}

/**
 * Oculta endpoints de gestión de DEVELOPER
 * No devuelve error 404, sino que rechaza silenciosamente
 */
export function shouldIgnoreDeveloperRequest(resource?: { rol?: string }): boolean {
  if (!resource) return false;
  return resource.rol === "DEVELOPER";
}
