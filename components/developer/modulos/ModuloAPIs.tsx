"use client";

// components/developer/modulos/ModuloAPIs.tsx
import { useState, useEffect } from "react";
import { Webhook, Search, Activity, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

interface APIEndpoint {
  path: string;
  method: string;
  description: string;
  status: "active" | "deprecated" | "error";
  lastUsed: string;
  requestCount: number;
  avgResponseTime: number;
}

export function ModuloAPIs() {
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Mock data - en producción esto vendría de la DB
    setEndpoints([
      {
        path: "/api/auth/login",
        method: "POST",
        description: "Autenticación de usuarios",
        status: "active",
        lastUsed: "2026-07-06T20:00:00Z",
        requestCount: 1247,
        avgResponseTime: 120,
      },
      {
        path: "/api/dashboard/simulacros",
        method: "GET",
        description: "Listado de simulacros disponibles",
        status: "active",
        lastUsed: "2026-07-06T19:45:00Z",
        requestCount: 892,
        avgResponseTime: 85,
      },
      {
        path: "/api/admin/simulacros",
        method: "POST",
        description: "Crear nuevo simulacro",
        status: "active",
        lastUsed: "2026-07-06T18:30:00Z",
        requestCount: 156,
        avgResponseTime: 340,
      },
      {
        path: "/api/developer/logs",
        method: "GET",
        description: "Logs del sistema",
        status: "active",
        lastUsed: "2026-07-06T20:05:00Z",
        requestCount: 423,
        avgResponseTime: 210,
      },
    ]);
    setLoading(false);
  }, []);

  const filteredEndpoints = endpoints.filter((ep) =>
    ep.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ep.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const methodColor = (method: string) => {
    switch (method) {
      case "GET": return "bg-green-100 text-green-700";
      case "POST": return "bg-blue-100 text-blue-700";
      case "PUT": return "bg-yellow-100 text-yellow-700";
      case "DELETE": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "deprecated": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "error": return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-gray-500">Cargando APIs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Endpoints API</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Monitoreo y estadísticas de endpoints
        </p>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar endpoint..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{endpoints.length}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Total Endpoints</div>
        </div>
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {endpoints.filter(e => e.status === "active").length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Activos</div>
        </div>
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {endpoints.reduce((sum, e) => sum + e.requestCount, 0).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Requests Hoy</div>
        </div>
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {Math.round(endpoints.reduce((sum, e) => sum + e.avgResponseTime, 0) / endpoints.length)}ms
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Avg Response</div>
        </div>
      </div>

      {/* Tabla */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Método</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Endpoint</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Descripción</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Requests</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Avg Time</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Último Uso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredEndpoints.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  No se encontraron endpoints
                </td>
              </tr>
            ) : (
              filteredEndpoints.map((endpoint) => (
                <tr key={endpoint.path} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${methodColor(endpoint.method)}`}>
                      {endpoint.method}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                    {endpoint.path}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {endpoint.description}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {statusIcon(endpoint.status)}
                      <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {endpoint.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {endpoint.requestCount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {endpoint.avgResponseTime}ms
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(endpoint.lastUsed).toLocaleString("es-CO")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
