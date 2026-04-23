// components/developer/DeveloperDashboard.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface DashboardData {
  sistema: {
    usuariosTotales: number;
    usuariosActivos: number;
    porRol: Array<{ rol: string; _count: number }>;
    simulacrosHoy: number;
  };
  logs: {
    sistema: Array<any>;
    auditoria: Array<any>;
  };
  backups: Array<any>;
  integraciones: Array<any>;
}

export function DeveloperDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "logs" | "backups" | "integrations"
  >("overview");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("developer_token");
      if (!token) {
        router.push("/developer/login");
        return;
      }

      const response = await fetch("/api/developer/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/developer/login");
        }
        return;
      }

      const result = await response.json();
      setData(result.dashboard);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("developer_token");
    localStorage.removeItem("developer_user");
    router.push("/developer/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-300">Cargando datos del sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header - Responsive */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-0">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded">
              <span className="text-white font-bold text-xs md:text-sm">DEV</span>
            </div>
            <div>
              <h1 className="text-base md:text-xl font-bold">Panel de Control - Desarrollador</h1>
              <p className="text-xs md:text-sm text-gray-400">Supervisión técnica del sistema</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 md:px-4 py-2 md:py-2 bg-red-900 hover:bg-red-800 rounded text-xs md:text-sm font-medium"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Tabs - Mobile scrollable */}
      <div className="bg-gray-800 border-b border-gray-700 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex gap-4 md:gap-8 min-w-min">
          {(
            ["overview", "logs", "backups", "integrations"] as const
          ).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 md:px-4 py-3 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${
                activeTab === tab
                  ? "border-blue-600 text-blue-400"
                  : "border-transparent text-gray-400 hover:text-gray-300"
              }`}
            >
              {tab === "overview"
                ? "Resumen"
                : tab === "logs"
                  ? "Registros"
                  : tab === "backups"
                    ? "Respaldos"
                    : "Integraciones"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {activeTab === "overview" && data && (
          <div className="space-y-6">
            {/* Stats Grid - Mobile: 2 cols, md: 4 cols */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 md:p-4">
                <p className="text-gray-400 text-xs md:text-sm mb-2">Usuarios Totales</p>
                <p className="text-lg md:text-2xl lg:text-3xl font-bold">{data.sistema.usuariosTotales}</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 md:p-4">
                <p className="text-gray-400 text-xs md:text-sm mb-2">Usuarios Activos</p>
                <p className="text-lg md:text-2xl lg:text-3xl font-bold text-green-400">
                  {data.sistema.usuariosActivos}
                </p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 md:p-4">
                <p className="text-gray-400 text-xs md:text-sm mb-2">Simulacros Hoy</p>
                <p className="text-lg md:text-2xl lg:text-3xl font-bold">{data.sistema.simulacrosHoy}</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 md:p-4 md:col-span-1">
                <p className="text-gray-400 text-xs md:text-sm mb-2">Roles</p>
                <p className="text-lg md:text-2xl lg:text-3xl font-bold">{data.sistema.porRol.length}</p>
              </div>
            </div>

            {/* User Distribution */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 md:p-6">
              <h2 className="text-base md:text-lg font-bold mb-4">Distribución de Usuarios</h2>
              <div className="space-y-3">
                {data.sistema.porRol.map((item) => (
                  <div key={item.rol} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <span className="capitalize text-xs md:text-sm">{item.rol}</span>
                    <div className="flex items-center gap-2 min-w-0 sm:flex-1">
                      <div className="flex-1 min-w-0 bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${
                              (item._count / data.sistema.usuariosTotales) * 100
                            }%`,
                          }}
                        ></div>
                      </div>
                      <span className="font-mono text-xs md:text-sm flex-shrink-0">{item._count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "logs" && data && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-base md:text-lg font-bold mb-4">Logs del Sistema (Últimos 20)</h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {data.logs.sistema.slice(0, 20).map((log: any) => (
                    <div
                      key={log.id}
                      className={`p-2 md:p-3 rounded text-xs md:text-sm bg-gray-800 border border-gray-700 ${
                        log.nivel === "ERROR" ? "border-red-700" : ""
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-mono flex-shrink-0 ${
                            log.nivel === "ERROR"
                              ? "bg-red-900 text-red-200"
                              : log.nivel === "WARN"
                                ? "bg-yellow-900 text-yellow-200"
                                : "bg-blue-900 text-blue-200"
                          }`}
                        >
                          {log.nivel}
                        </span>
                        <span className="text-gray-500 text-xs flex-shrink-0">
                          {new Date(log.createdAt).toLocaleTimeString("es-ES")}
                        </span>
                      </div>
                      <p className="mt-2">{log.mensaje}</p>
                      <p className="text-xs text-gray-500 mt-1">{log.componente}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-base md:text-lg font-bold mb-4">Auditoría (Últimos 20)</h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {data.logs.auditoria.slice(0, 20).map((log: any) => (
                    <div
                      key={log.id}
                      className="p-2 md:p-3 rounded text-xs md:text-sm bg-gray-800 border border-gray-700"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="px-2 py-1 rounded text-xs bg-purple-900 text-purple-200 font-mono flex-shrink-0">
                          {log.accion}
                        </span>
                        <span className="text-gray-500 text-xs flex-shrink-0">
                          {new Date(log.createdAt).toLocaleTimeString("es-ES")}
                        </span>
                      </div>
                      <p className="mt-2">{log.usuario?.nombre || "Sistema"}</p>
                      <p className="text-xs text-gray-500 mt-1">{log.recurso}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "backups" && (
          <div>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-0 mb-4">
              <h2 className="text-base md:text-lg font-bold">Gestión de Respaldos</h2>
              <button className="px-3 md:px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-medium text-xs md:text-sm">
                + Crear Respaldo
              </button>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-x-auto">
              <table className="w-full text-xs md:text-sm">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 md:px-6 py-2 md:py-3 text-left font-semibold">Tipo</th>
                    <th className="px-4 md:px-6 py-2 md:py-3 text-left font-semibold">Estado</th>
                    <th className="px-4 md:px-6 py-2 md:py-3 text-left font-semibold">Tamaño</th>
                    <th className="px-4 md:px-6 py-2 md:py-3 text-left font-semibold">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {data && data.backups.map((backup: any) => (
                    <tr key={backup.id} className="hover:bg-gray-700">
                      <td className="px-4 md:px-6 py-2 md:py-4">{backup.tipo}</td>
                      <td className="px-4 md:px-6 py-2 md:py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-mono ${
                            backup.estado === "COMPLETADO"
                              ? "bg-green-900 text-green-200"
                              : backup.estado === "ERROR"
                                ? "bg-red-900 text-red-200"
                                : "bg-yellow-900 text-yellow-200"
                          }`}
                        >
                          {backup.estado}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-2 md:py-4">{backup.tamanio} MB</td>
                      <td className="px-4 md:px-6 py-2 md:py-4 text-gray-400">
                        {new Date(backup.createdAt).toLocaleDateString("es-ES")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "integrations" && (
          <div>
            <h2 className="text-base md:text-lg font-bold mb-4">Estado de Integraciones</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data && data.integraciones.map((integracion: any) => (
                <div
                  key={integracion.id}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold">{integracion.nombre}</h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-mono ${
                        integracion.estado === "CONECTADO"
                          ? "bg-green-900 text-green-200"
                          : integracion.estado === "ERROR"
                            ? "bg-red-900 text-red-200"
                            : "bg-yellow-900 text-yellow-200"
                      }`}
                    >
                      {integracion.estado}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-400">
                    <div>Response Time: {integracion.responseTime}ms</div>
                    <div>Requests Hoy: {integracion.requestsHoy}</div>
                    <div>Tasa de Error: {integracion.tasaError}%</div>
                    <div>
                      Última Verificación:{" "}
                      {new Date(integracion.ultimaVerif).toLocaleTimeString("es-ES")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
