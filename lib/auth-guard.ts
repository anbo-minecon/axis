// libs/auth-guard.ts
import { Session } from "next-auth";

/**
 * Verifica si el usuario está autenticado
 */
export function isAuthenticated(session: Session | null): boolean {
  return session?.user !== undefined;
}

/**
 * Verifica si el usuario tiene suscripción activa
 */
export function hasActiveSubscription(session: Session | null): boolean {
  return session?.user?.tieneSubscripcion ?? false;
}

/**
 * Verifica si el usuario puede acceder a una funcionalidad
 */
export function canAccess(
  session: Session | null,
  requiresSubscription: boolean = false
): boolean {
  if (!isAuthenticated(session)) {
    return false;
  }

  if (requiresSubscription && !hasActiveSubscription(session)) {
    return false;
  }

  return true;
}

/**
 * Funcionalidades que requieren suscripción
 */
export const FUNCIONALIDADES_PREMIUM = [
  "simulacros",
  "resultados",
  "estadisticas",
  "grupo",
  "competencia",
];

/**
 * Funcionalidades accesibles sin suscripción
 */
export const FUNCIONALIDADES_GRATIS = [
  "perfil",
  "notificaciones",
  "ranking",
  "material",
  "planes",
];
