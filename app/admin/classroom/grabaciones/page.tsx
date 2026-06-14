// app/admin/classroom/grabaciones/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search, Video, Download, ExternalLink, Trash2, Loader,
  ChevronLeft, ChevronRight, Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Toast } from "@/lib/notifications";

interface Grabacion {
  id:        string;
  titulo:    string;
  descripcion?: string;
  linkUrl:   string;
  fecha:     string;
  duracionMin?: number;
  materia?:  string;
  activa:    boolean;
  clase:     {
    nombre:   string;
    materia?: string;
  };
}

export default function GrabacionesPage() {
  const [grabaciones, setGrabaciones] = useState<Grabacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroMateria, setFiltroMateria] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        ...(busqueda && { q: busqueda }),
        ...(filtroMateria && { materia: filtroMateria }),
      });

      const res = await fetch(`/api/classroom/grabaciones?${params}`);
      const data = await res.json();

      if (res.ok) {
        setGrabaciones(data.grabaciones ?? []);
        setTotalPages(data.pagination?.totalPages ?? 1);
        setTotal(data.pagination?.total ?? 0);
      } else {
        Toast.error("Error", "No se pudieron cargar las grabaciones");
      }
    } catch {
      Toast.error("Error", "Error de conexión");
    } finally {
      setLoading(false);
    }
  }, [page, busqueda, filtroMateria]);

  useEffect(() => {
    const timer = setTimeout(cargar, 300);
    return () => clearTimeout(timer);
  }, [cargar]);

  const handleEliminar = async (id: string, titulo: string) => {
    if (!confirm(`¿Eliminar grabación "${titulo}"?`)) return;

    setDeleting(id);
    try {
      const res = await fetch("/api/classroom/grabaciones", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        Toast.success("Eliminado", "Grabación eliminada");
        cargar();
      } else {
        Toast.error("Error", "No se pudo eliminar");
      }
    } catch {
      Toast.error("Error", "Error de conexión");
    } finally {
      setDeleting(null);
    }
  };

  const materias = [...new Set(grabaciones.map(g => g.clase.materia).filter(Boolean))];

  return (
    <div className="min-h-full p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link
            href="/admin/classroom"
            className="inline-flex items-center gap-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 mb-4 text-sm text-gray-600 dark:text-gray-400 transition"
          >
            <ChevronLeft className="h-4 w-4" /> Volver
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Video className="h-8 w-8 text-purple-600" />
            Grabaciones
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {total} grabaciones disponibles
          </p>
        </div>

        {/* Filtros */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Busqueda */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar grabaciones..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              />
            </div>

            {/* Filtro materia */}
            <select
              value={filtroMateria}
              onChange={(e) => {
                setFiltroMateria(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            >
              <option value="">Todas las materias</option>
              {materias.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Contenido */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader className="h-8 w-8 text-purple-600 animate-spin" />
          </div>
        ) : grabaciones.length === 0 ? (
          <div className="text-center py-24 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <Video className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No hay grabaciones
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Las grabaciones aparecerán aquí cuando se agreguen a las clases
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Tabla */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Título</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Clase</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Materia</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Fecha</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Duración</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grabaciones.map(grabacion => (
                      <tr
                        key={grabacion.id}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white truncate">
                              {grabacion.titulo}
                            </p>
                            {grabacion.descripcion && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                {grabacion.descripcion}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/classroom/clases/${grabacion.clase}`}
                            className="text-blue-600 hover:underline text-sm"
                          >
                            {grabacion.clase.nombre}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                            {grabacion.clase.materia || "Sin materia"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(grabacion.fecha).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {grabacion.duracionMin ? `${grabacion.duracionMin} min` : "-"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={grabacion.linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 p-2 text-gray-600 dark:text-gray-400 transition"
                              title="Abrir grabación"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                            <button
                              onClick={() => handleEliminar(grabacion.id, grabacion.titulo)}
                              disabled={deleting === grabacion.id}
                              className="flex items-center gap-1 rounded-lg border border-red-300 dark:border-red-600/30 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 text-red-600 dark:text-red-400 transition disabled:opacity-50"
                              title="Eliminar grabación"
                            >
                              {deleting === grabacion.id ? (
                                <Loader className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Página {page} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 p-2 text-gray-600 dark:text-gray-400 disabled:opacity-40 transition"
                  >
                    <ChevronLeft className="h-4 w-4" /> Anterior
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 p-2 text-gray-600 dark:text-gray-400 disabled:opacity-40 transition"
                  >
                    Siguiente <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
