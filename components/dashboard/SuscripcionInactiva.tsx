// components/dashboard/SuscripcionInactiva.tsx
"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export function SuscripcionInactiva() {
  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
        {/* Ícono */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
        </div>

        {/* Título */}
        <h2 className="mb-2 text-xl font-semibold text-amber-900">
          Suscripción no activa
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-amber-700">
          Tu cuenta está registrada pero aún no tienes una suscripción activa.
          Contacta al equipo AXIS para validar tu pago y habilitar el acceso
          completo a la plataforma.
        </p>

        {/* Pasos */}
        <div className="mb-6 rounded-xl bg-white/70 p-4 text-left">
          <p className="mb-2 text-sm font-medium text-amber-900">
            Para activar tu suscripción:
          </p>
          <ol className="space-y-1 text-sm text-amber-800">
            <li>1. Selecciona un plan de suscripción</li>
            <li>2. Realiza el pago mediante contacto con AXIS</li>
            <li>3. El administrador habilitará tu acceso</li>
          </ol>
        </div>

        {/* Botones */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard/planes"
            className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-600"
          >
            Ver planes →
          </Link>
          <Link
            href="/dashboard/material?gratis=true"
            className="flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-white px-6 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-50"
          >
            Ver material gratuito
          </Link>
        </div>
      </div>
    </div>
  );
}