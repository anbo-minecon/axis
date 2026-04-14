// hooks/useUser.ts
"use client";

import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc-client";
import { useEffect, useState } from "react";
import { FUNCIONALIDADES_PREMIUM } from "@/lib/auth-guard";

/** Datos del usuario autenticado junto con su perfil completo */
export function useUser() {
  const { data: session, status } = useSession();
  const [usuario, setUsuario] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Obtener perfil completo del usuario vía tRPC
  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      const fetchPerfil = async () => {
        try {
          const resultado = await trpc.auth.obtenerPerfil.query();
          setUsuario(resultado);
        } catch (error) {
          console.error("Error al obtener perfil:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchPerfil();
    } else {
      setLoading(false);
    }
  }, [status, session?.user?.id]);

  return {
    usuario,
    session,
    loading,
    isAuthenticated: status === "authenticated",
    isError: status === "unauthenticated",
    // Acceso rápido al campo de suscripción desde la sesión (sin fetch extra)
    tieneSubscripcion: session?.user?.tieneSubscripcion ?? false,
  };
}

/**
 * Hook para verificar si el usuario tiene suscripción activa.
 * Consulta el estado real vía tRPC para mayor precisión.
 */
export function useSuscripcion() {
  const { isAuthenticated } = useUser();
  const [suscripcion, setSuscripcion] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchSuscripcion = async () => {
      try {
        const resultado = await trpc.suscripcion.obtenerEstado.query();
        setSuscripcion(resultado);
      } catch (error) {
        console.error("Error al obtener estado de suscripción:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuscripcion();
  }, [isAuthenticated]);

  return {
    suscripcion,
    tieneSubscripcion: suscripcion?.activa ?? false,
    loading,
  };
}

/**
 * Hook para verificar acceso a una funcionalidad específica.
 *
 * Estrategia en dos capas:
 *  1. Si la funcionalidad NO está en FUNCIONALIDADES_PREMIUM, permite acceso
 *     inmediatamente sin llamada al servidor.
 *  2. Si es premium, consulta trpc.suscripcion.verificarAcceso para validación
 *     real; mientras carga usa el valor local de tieneSubscripcion como fallback.
 *
 * Uso: const { accesoPermitido } = useAcceso("simulacros");
 */
export function useAcceso(funcionalidad: string) {
  const { tieneSubscripcion } = useSuscripcion();
  const [accesoPermitido, setAccesoPermitido] = useState(false);

  const esPremium = FUNCIONALIDADES_PREMIUM.includes(funcionalidad);

  useEffect(() => {
    // Si no requiere suscripción, permitir de inmediato
    if (!esPremium) {
      setAccesoPermitido(true);
      return;
    }

    // Fallback rápido mientras llega la respuesta del servidor
    setAccesoPermitido(tieneSubscripcion);

    const verificar = async () => {
      try {
        const resultado = await trpc.suscripcion.verificarAcceso.query(
          funcionalidad as any
        );
        setAccesoPermitido(resultado.accesoPermitido);
      } catch (error) {
        // En caso de error, confiar en el valor local
        setAccesoPermitido(tieneSubscripcion);
      }
    };

    verificar();
  }, [tieneSubscripcion, funcionalidad, esPremium]);

  return { accesoPermitido };
}