// hooks/useUser.ts
"use client";

import { useSession } from "next-auth/react";
import { FUNCIONALIDADES_PREMIUM } from "@/lib/auth-guard";

/** Datos del usuario autenticado */
export function useUser() {
  const { data: session, status } = useSession();

  return {
    user: session?.user ?? null,
    session,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    tieneSubscripcion: session?.user?.tieneSubscripcion ?? false,
  };
}

/** Estado de suscripción del usuario */
export function useSuscripcion() {
  const { tieneSubscripcion } = useUser();

  return {
    tieneSubscripcion,
  };
}

/**
 * Verifica si el usuario puede acceder a una funcionalidad.
 * Uso: const puedeVer = useAcceso("simulacros");
 */
export function useAcceso(funcionalidad: string): boolean {
  const { tieneSubscripcion, isAuthenticated } = useUser();

  if (!isAuthenticated) return false;

  if (FUNCIONALIDADES_PREMIUM.includes(funcionalidad)) {
    return tieneSubscripcion;
  }

  return true;
}