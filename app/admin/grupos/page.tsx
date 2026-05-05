"use client";

import { AlertCircle } from "lucide-react";

export default function AdminGruposPage() {
  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Gestión de Grupos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Administra los grupos de estudiantes
          </p>
        </div>

        {/* No disponible Alert */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
          <div className="flex flex-col items-center justify-center text-center gap-4">
            <div className="rounded-full bg-orange-100 dark:bg-orange-900/20 p-4">
              <AlertCircle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                No disponible
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Se habilitará próximamente
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
