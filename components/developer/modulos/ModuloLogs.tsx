"use client";

// components/developer/modulos/ModuloLogs.tsx
import { useState, useEffect } from "react";
import { ScrollText, Search, Filter, Download, AlertCircle, Info, CheckCircle2, XCircle } from "lucide-react";

interface LogEntry {
  id: string;
  nivel: "INFO" | "WARNING" | "ERROR" | "DEBUG";
  componente: string;
  mensaje: string;
  detalles?: string;
  createdAt: string;
}

export function ModuloLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterNivel, setFilterNivel] = useState("todos");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem("developer_token");
      const res = await fetch("/api/developer/logs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
      // Mock data si falla
      setLogs([
        {
          id: "1",
          nivel: "INFO",
          componente: "SimulacroExamen",
          mensaje: "Usuario inició simulacro",
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          nivel: "WARNING",
          componente: "API",
          mensaje: "Rate limit excedido",
          detalles: "Usuario excedió límite de requests por minuto",
          createdAt: new Date(Date.now() - 300000).toISOString(),
        },
        {
          id: "3",
          nivel: "ERROR",
          componente: "Database",
          mensaje: "Connection timeout",
          detalles: "No se pudo conectar a la base de datos",
          createdAt: new Date(Date.now() - 600000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchSearch = log.mensaje.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       log.componente.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filterNivel === "todos" || log.nivel === filterNivel;
    return matchSearch && matchFilter;
  });

  const nivelIcon = (nivel: string) => {
    switch (nivel) {
      case "INFO": return <Info className="h-4 w-4 text-blue-500" />;
      case "WARNING": return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "ERROR": return <XCircle className="h-4 w-4 text-red-500" />;
      case "DEBUG": return <CheckCircle2 className="h-4 w-4 text-gray-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const nivelColor = (nivel: string) => {
    switch (nivel) {
      case "INFO": return "bg-blue-100 text-blue-700";
      case "WARNING": return "bg-yellow-100 text-yellow-700";
      case "ERROR": return "bg-red-100 text-red-700";
      case "DEBUG": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-gray-500">Cargando logs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Logs del Sistema</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {logs.length} registros de eventos
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
          <Download className="h-4 w-4" />
          Exportar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar en logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <select
          value={filterNivel}
          onChange={(e) => setFilterNivel(e.target.value)}
          className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="todos">Todos los niveles</option>
          <option value="INFO">Info</option>
          <option value="WARNING">Warning</option>
          <option value="ERROR">Error</option>
          <option value="DEBUG">Debug</option>
        </select>
      </div>

      {/* Lista de logs */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
            No se encontraron logs
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{nivelIcon(log.nivel)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${nivelColor(log.nivel)}`}>
                      {log.nivel}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {log.componente}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(log.createdAt).toLocaleString("es-CO")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-white">{log.mensaje}</p>
                  {log.detalles && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{log.detalles}</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
