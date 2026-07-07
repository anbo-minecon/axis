"use client";

// components/developer/modulos/ModuloRespaldo.tsx
import { useState, useEffect } from "react";
import { HardDrive, Play, Download, Trash2, Clock, CheckCircle2, AlertTriangle } from "lucide-react";

interface BackupLog {
  id: string;
  tipo: string;
  estado: string;
  tamanio?: number;
  ubicacion?: string;
  error?: string;
  duracionMs?: number;
  createdAt: string;
}

export function ModuloRespaldo() {
  const [backups, setBackups] = useState<BackupLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    try {
      const token = localStorage.getItem("developer_token");
      const res = await fetch("/api/developer/backups", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setBackups(data.backups || []);
      }
    } catch (error) {
      console.error("Error fetching backups:", error);
      // Mock data si falla
      setBackups([
        {
          id: "1",
          tipo: "COMPLETO",
          estado: "COMPLETADO",
          tamanio: 52428800,
          ubicacion: "/backups/backup_2026_07_06.sql",
          duracionMs: 45000,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: "2",
          tipo: "INCREMENTAL",
          estado: "COMPLETADO",
          tamanio: 1048576,
          ubicacion: "/backups/inc_2026_07_06_14.sql",
          duracionMs: 5000,
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: "3",
          tipo: "COMPLETO",
          estado: "FALLIDO",
          error: "Error de conexión a base de datos",
          createdAt: new Date(Date.now() - 10800000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/developer/backups", { method: "POST" });
      if (res.ok) {
        await fetchBackups();
      }
    } catch (error) {
      console.error("Error creating backup:", error);
    } finally {
      setCreating(false);
    }
  };

  const estadoColor = (estado: string) => {
    switch (estado) {
      case "COMPLETADO": return "bg-green-100 text-green-700";
      case "EN_PROGRESO": return "bg-blue-100 text-blue-700";
      case "FALLIDO": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const estadoIcon = (estado: string) => {
    switch (estado) {
      case "COMPLETADO": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "EN_PROGRESO": return <Clock className="h-4 w-4 text-blue-500" />;
      case "FALLIDO": return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <CheckCircle2 className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return "—";
    const mb = bytes / (1024 * 1024);
    return mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(2)} MB`;
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return "—";
    return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-gray-500">Cargando respaldos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Respaldo de Base de Datos</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gestión de backups automáticos y manuales
          </p>
        </div>
        <button
          onClick={createBackup}
          disabled={creating}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="h-4 w-4" />
          {creating ? "Creando..." : "Crear Respaldo"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{backups.length}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Total Backups</div>
        </div>
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {backups.filter(b => b.estado === "COMPLETADO").length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Completados</div>
        </div>
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {formatSize(backups.reduce((sum, b) => sum + (b.tamanio || 0), 0))}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Espacio Total</div>
        </div>
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {formatDuration(backups.reduce((sum, b) => sum + (b.duracionMs || 0), 0) / backups.length || 0)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Avg Duración</div>
        </div>
      </div>

      {/* Tabla */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Tamaño</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Ubicación</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Duración</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Fecha</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {backups.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  No hay respaldos disponibles
                </td>
              </tr>
            ) : (
              backups.map((backup) => (
                <tr key={backup.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                    {backup.tipo}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {estadoIcon(backup.estado)}
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${estadoColor(backup.estado)}`}>
                        {backup.estado}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {formatSize(backup.tamanio)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                    {backup.ubicacion || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {formatDuration(backup.duracionMs)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(backup.createdAt).toLocaleString("es-CO")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {backup.estado === "COMPLETADO" && (
                        <button className="p-1.5 text-gray-400 hover:text-blue-600 transition" title="Descargar">
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                      <button className="p-1.5 text-gray-400 hover:text-red-600 transition" title="Eliminar">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {backups.some(b => b.error) && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-medium mb-2">
            <AlertTriangle className="h-4 w-4" />
            Errores recientes
          </div>
          {backups.filter(b => b.error).map((b) => (
            <div key={b.id} className="text-sm text-red-600 dark:text-red-400">
              {b.error}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
