"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Users, FileText, TrendingUp, Calendar, AlertCircle } from "lucide-react";

interface Grupo {
  id: string;
  nombre: string;
  estudiantes: number;
  createdAt: string;
}

export default function DocenteDashboard() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [stats] = useState({
    totalGrupos: 0,
    totalEstudiantes: 0,
    actividadesAsignadas: 0,
    studentsActive: 0,
  });

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-full p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header - Responsive Typography */}
        <div className="flex flex-col gap-1 md:gap-2">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
            Panel de Docente
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            Bienvenido, {session?.user?.name || "Docente"}
          </p>
        </div>

        {/* Alert - Responsive */}
        <div className="border border-yellow-200 bg-yellow-50 dark:border-yellow-900/30 dark:bg-yellow-900/10 rounded-lg p-3 md:p-4 flex gap-2 md:gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs md:text-sm text-yellow-800 dark:text-yellow-200">
              Los módulos de gestión de grupos y actividades están en desarrollo.
            </p>
          </div>
        </div>

        {/* Stats Grid - Mobile responsive (grid-cols-2 for mobile, md:grid-cols-3, lg:grid-cols-4) */}
        <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {/* Stat Card 1 */}
          <div className="border border-gray-100 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 p-4 md:p-5 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Grupos</p>
                <p className="text-xl md:text-2xl font-bold mt-1 md:mt-2 text-gray-900 dark:text-white">
                  {stats.totalGrupos}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 md:mt-1">Grupos creados</p>
              </div>
              <Users className="h-7 w-7 md:h-8 md:w-8 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            </div>
          </div>

          {/* Stat Card 2 */}
          <div className="border border-gray-100 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 p-4 md:p-5 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Estudiantes</p>
                <p className="text-xl md:text-2xl font-bold mt-1 md:mt-2 text-gray-900 dark:text-white">
                  {stats.totalEstudiantes}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 md:mt-1">Total de estudiantes</p>
              </div>
              <TrendingUp className="h-7 w-7 md:h-8 md:w-8 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            </div>
          </div>

          {/* Stat Card 3 */}
          <div className="border border-gray-100 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 p-4 md:p-5 shadow-sm md:col-span-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Actividades</p>
                <p className="text-xl md:text-2xl font-bold mt-1 md:mt-2 text-gray-900 dark:text-white">
                  {stats.actividadesAsignadas}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 md:mt-1">Actividades asignadas</p>
              </div>
              <FileText className="h-7 w-7 md:h-8 md:w-8 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            </div>
          </div>

          {/* Stat Card 4 */}
          <div className="border border-gray-100 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 p-4 md:p-5 shadow-sm md:col-span-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Activos Hoy</p>
                <p className="text-xl md:text-2xl font-bold mt-1 md:mt-2 text-gray-900 dark:text-white">
                  {stats.studentsActive}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 md:mt-1">Estudiantes activos</p>
              </div>
              <Calendar className="h-7 w-7 md:h-8 md:w-8 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            </div>
          </div>
        </div>

        {/* Tabs Section - Mobile friendly */}
        <div className="border border-gray-100 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
          {/* Tab List - Scrollable on mobile */}
          <div className="flex border-b border-gray-100 dark:border-gray-700 overflow-x-auto">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 md:px-6 py-3 md:py-4 font-medium text-xs md:text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "overview"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
              }`}
            >
              Resumen
            </button>
            <button
              onClick={() => setActiveTab("grupos")}
              className={`px-4 md:px-6 py-3 md:py-4 font-medium text-xs md:text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "grupos"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
              }`}
            >
              Grupos
            </button>
            <button
              onClick={() => setActiveTab("actividades")}
              className={`px-4 md:px-6 py-3 md:py-4 font-medium text-xs md:text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "actividades"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
              }`}
            >
              Actividades
            </button>
          </div>

          {/* Tab Content - Responsive padding */}
          <div className="p-4 md:p-6">
            {activeTab === "overview" && (
              <div className="space-y-3 md:space-y-4">
                <h3 className="font-semibold text-base md:text-lg">Bienvenida</h3>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  Esta es tu área de gestión como docente en AXIS PreICFES. Aquí podrás:
                </p>
                <ul className="space-y-2 text-xs md:text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-blue-600 dark:text-blue-400">•</span>
                    <span className="text-gray-700 dark:text-gray-300">Crear y gestionar grupos de estudiantes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-600 dark:text-blue-400">•</span>
                    <span className="text-gray-700 dark:text-gray-300">Asignar simulacros y actividades</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-600 dark:text-blue-400">•</span>
                    <span className="text-gray-700 dark:text-gray-300">Monitorear el progreso de tus estudiantes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-600 dark:text-blue-400">•</span>
                    <span className="text-gray-700 dark:text-gray-300">Generar reportes de desempeño</span>
                  </li>
                </ul>
              </div>
            )}

            {activeTab === "grupos" && (
              <div>
                <h3 className="font-semibold text-base md:text-lg mb-4">Mis Grupos</h3>
                {grupos.length === 0 ? (
                  <div className="text-center py-6 md:py-8">
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Aun no has creado ningun grupo
                    </p>
                    <button className="px-3 md:px-4 py-2 md:py-3 bg-blue-600 dark:bg-blue-700 text-white text-xs md:text-base rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition font-medium">
                      Crear Grupo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 md:space-y-4">
                    {grupos.map((grupo) => (
                      <div key={grupo.id} className="border border-gray-200 dark:border-gray-700 rounded p-3 md:p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                        <h4 className="font-medium text-sm md:text-base text-gray-900 dark:text-white">{grupo.nombre}</h4>
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {grupo.estudiantes} estudiantes
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "actividades" && (
              <div>
                <h3 className="font-semibold text-base md:text-lg mb-4">Actividades Asignadas</h3>
                <div className="text-center py-6 md:py-8">
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                    No hay actividades asignadas por el momento
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}