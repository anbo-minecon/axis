"use client";

// components/developer/modulos/ModuloAuditorias.tsx
import { useState, useEffect } from "react";
import { ShieldCheck, Search, Filter, User, Calendar, AlertTriangle } from "lucide-react";

interface AuditLog {
  id: string;
  usuarioId?: string;
  usuarioNombre?: string;
  accion: string;
  recurso?: string;
  recursoId?: string;
  resultado: string;
  mensaje?: string;
  ip?: string;
  createdAt: string;
}

export function ModuloAuditorias() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterResultado, setFilterResultado] = useState("todos");

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const token = localStorage.getItem("developer_token");
      const res = await fetch("/api/developer/auditorias", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      // Mock data si falla
      setLogs([
        {
          id: "1",
          usuarioNombre: "Admin",
          accion: "CREAR_SIMULACRO",
          recurso: "ExamenTemplate",
          recursoId: "sim_123",
          resultado: "EXITOSO",
          mensaje: "Simulacro creado exitosamente",
          ip: "192.168.1.1",
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          usuarioNombre: "Docente",
          accion: "ACTUALIZAR_GRUPO",
          recurso: "Grupo",
          recursoId: "grp_456",
          resultado: "EXITOSO",
          mensaje: "Grupo actualizado",
          ip: "192.168.1.2",
          createdAt: new Date(Date.now() - 300000).toISOString(),
        },
        {
          id: "3",
          accion: "LOGIN_FALLIDO",
          recurso: "Auth",
          resultado: "FALLIDO",
          mensaje: "Intento de login fallido - credenciales inválidas",
          ip: "192.168.1.3",
          createdAt: new Date(Date.now() - 600000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchSearch = log.accion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (log.usuarioNombre?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                       (log.mensaje?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchFilter = filterResultado === "todos" || log.resultado === filterResultado;
    return matchSearch && matchFilter;
  });

  const resultadoColor = (resultado: string) => {
    switch (resultado) {
      case "EXITOSO": return "bg-green-100 text-green-700";
      case "FALLIDO": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const resultadoIcon = (resultado: string) => {
    switch (resultado) {
      case "EXITOSO": return <ShieldCheck className="h-4 w-4 text-green-500" />;
      case "FALLIDO": return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-gray-500">Cargando auditorías...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Auditoría del Sistema</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Registro de acciones y eventos de seguridad
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
          Exportar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar en auditorías..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <select
          value={filterResultado}
          onChange={(e) => setFilterResultado(e.target.value)}
          className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="todos">Todos los resultados</option>
          <option value="EXITOSO">Exitoso</option>
          <option value="FALLIDO">Fallido</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{logs.length}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Total Eventos</div>
        </div>
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {logs.filter(l => l.resultado === "EXITOSO").length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Exitosos</div>
        </div>
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="text-2xl font-bold text-red-600">
            {logs.filter(l => l.resultado === "FALLIDO").length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Fallidos</div>
        </div>
      </div>

      {/* Tabla */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Usuario</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Acción</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Recurso</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Resultado</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">IP</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  No se encontraron registros
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {log.usuarioNombre || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">
                    {log.accion}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {log.recurso} {log.recursoId && `(${log.recursoId})`}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {resultadoIcon(log.resultado)}
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${resultadoColor(log.resultado)}`}>
                        {log.resultado}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {log.ip || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(log.createdAt).toLocaleString("es-CO")}
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
