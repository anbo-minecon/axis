// components/dashboard/SuscripcionInactiva.tsx
"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export function SuscripcionInactiva() {
  return (
    <div className="flex min-h-full items-center justify-center p-6 bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-lg rounded-2xl border border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10 px-10 py-10 text-center shadow-sm dark:shadow-md">
        {/* Ícono */}
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <AlertTriangle className="h-8 w-8 text-amber-400" />
        </div>

        {/* Título */}
        <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
          Suscripción no activa
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-gray-600 dark:text-gray-300 max-w-sm mx-auto">
          Tu cuenta está registrada pero aún no tienes una suscripción activa.
          Contacta al equipo AXIS para validar tu pago y habilitar el acceso
          completo a la plataforma.
        </p>

        {/* Pasos */}
        <div className="mb-7 rounded-xl border border-amber-100 dark:border-amber-900/30 bg-white dark:bg-gray-800 px-6 py-4 text-left">
          <p className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-200">
            Para activar tu suscripción:
          </p>
          <ol className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
            <li>1. Selecciona un plan de suscripción</li>
            <li>2. Realiza el pago mediante contacto con AXIS</li>
            <li>3. El administrador habilitará tu acceso</li>
          </ol>
        </div>

        {/* Botones */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard/planes"
            className="flex items-center justify-center gap-2 rounded-xl bg-amber-400 dark:bg-amber-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-amber-500 dark:hover:bg-amber-700 shadow-sm"
          >
            Ver planes →
          </Link>
          <Link
            href="/dashboard/material?gratis=true"
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-8 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm"
          >
            Ver material gratuito
          </Link>
        </div>
      </div>
    </div>
  );
}