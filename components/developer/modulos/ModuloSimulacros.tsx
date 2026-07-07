"use client";

// components/developer/modulos/ModuloSimulacros.tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Search, Filter, Eye, Edit, Trash2, Plus, Archive, FileText, Users, Clock, AlertTriangle } from "lucide-react";

interface Simulacro {
  id: string;
  nombre: string;
  materia: string;
  estado: string;
  totalPreguntas: number;
  tiempoMin: number;
  tipo: string;
  materiasCount: number;
  participantes: number;
  createdAt: string;
  updatedAt: string;
}

export function ModuloSimulacros() {
  const router = useRouter();
  const [simulacros, setSimulacros] = useState<Simulacro[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");

  useEffect(() => {
    fetchSimulacros();
  }, []);

  const fetchSimulacros = async () => {
    try {
      const token = localStorage.getItem("developer_token");
      const res = await fetch("/api/developer/simulacros", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setSimulacros(data.simulacros || []);
      }
    } catch (error) {
      console.error("Error fetching simulacros:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSimulacros = simulacros.filter((s) => {
    const matchSearch = s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       s.materia.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filterEstado === "todos" || s.estado === filterEstado;
    return matchSearch && matchFilter;
  });

  const estadoColor = (estado: string) => {
    switch (estado) {
      case "PUBLICADO": return "bg-green-100 text-green-700 border-green-200";
      case "BORRADOR": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "CERRADO": return "bg-gray-100 text-gray-700 border-gray-200";
      case "ARCHIVADO": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const estadoIcon = (estado: string) => {
    switch (estado) {
      case "PUBLICADO": return <FileText className="h-4 w-4" />;
      case "BORRADOR": return <Edit className="h-4 w-4" />;
      case "CERRADO": return <Clock className="h-4 w-4" />;
      case "ARCHIVADO": return <Archive className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const canDelete = (simulacro: Simulacro) => {
    return simulacro.participantes < 10;
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este simulacro? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      const token = localStorage.getItem("developer_token");
      const res = await fetch(`/api/developer/simulacros/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        fetchSimulacros();
      } else {
        alert("Error al eliminar simulacro");
      }
    } catch (error) {
      console.error("Error deleting simulacro:", error);
      alert("Error de conexión");
    }
  };

  const handleArchive = async (id: string) => {
    try {
      const token = localStorage.getItem("developer_token");
      const res = await fetch(`/api/developer/simulacros/${id}/archive`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        fetchSimulacros();
      } else {
        alert("Error al archivar simulacro");
      }
    } catch (error) {
      console.error("Error archiving simulacro:", error);
      alert("Error de conexión");
    }
  };

  const handlePublish = async (id: string) => {
    try {
      const token = localStorage.getItem("developer_token");
      const res = await fetch(`/api/developer/simulacros/${id}/publish`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        fetchSimulacros();
      } else {
        alert("Error al publicar simulacro");
      }
    } catch (error) {
      console.error("Error publishing simulacro:", error);
      alert("Error de conexión");
    }
  };

  const handleUnarchive = async (id: string) => {
    try {
      const token = localStorage.getItem("developer_token");
      const res = await fetch(`/api/developer/simulacros/${id}/unarchive`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        fetchSimulacros();
      } else {
        alert("Error al desarchivar simulacro");
      }
    } catch (error) {
      console.error("Error unarchiving simulacro:", error);
      alert("Error de conexión");
    }
  };

  const handleDraft = async (id: string) => {
    try {
      const token = localStorage.getItem("developer_token");
      const res = await fetch(`/api/developer/simulacros/${id}/draft`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        fetchSimulacros();
      } else {
        alert("Error al guardar como borrador");
      }
    } catch (error) {
      console.error("Error saving as draft:", error);
      alert("Error de conexión");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-gray-500">Cargando simulacros...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Simulacros</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {simulacros.length} simulacros en el sistema
          </p>
        </div>
        <button 
          onClick={() => router.push("/dashboard/simulacros")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" />
          Nuevo Simulacro
        </button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar simulacro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="todos">Todos los estados</option>
          <option value="PUBLICADO">Publicado</option>
          <option value="BORRADOR">Borrador</option>
          <option value="CERRADO">Cerrado</option>
          <option value="ARCHIVADO">Archivado</option>
        </select>
      </div>

      {/* Grid de Cards */}
      {filteredSimulacros.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No se encontraron simulacros
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSimulacros.map((simulacro) => (
            <div
              key={simulacro.id}
              className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow"
            >
              {/* Header de la card */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {simulacro.nombre}
                  </h3>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${estadoColor(simulacro.estado)}`}>
                    {estadoIcon(simulacro.estado)}
                    {simulacro.estado}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {simulacro.tipo}
                  </span>
                </div>
              </div>

              {/* Info del simulacro */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <FileText className="h-4 w-4" />
                  <span>{simulacro.materia}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <ClipboardList className="h-4 w-4" />
                  <span>{simulacro.totalPreguntas} preguntas</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Users className="h-4 w-4" />
                  <span>{simulacro.participantes} participantes</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span>{simulacro.tiempoMin} minutos</span>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => router.push(`/developer/simulacros/${simulacro.id}/edit`)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </button>
                <button
                  onClick={() => router.push(`/developer/simulacros/${simulacro.id}/view`)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
                >
                  <Eye className="h-4 w-4" />
                  Ver
                </button>
              </div>

              {/* Acciones secundarias */}
              <div className="flex items-center gap-2 mt-2">
                {simulacro.estado === "BORRADOR" && (
                  <>
                    <button
                      onClick={() => handlePublish(simulacro.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition"
                    >
                      Publicar
                    </button>
                    {canDelete(simulacro) && (
                      <button
                        onClick={() => handleDelete(simulacro.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                      >
                        <Trash2 className="h-3 w-3" />
                        Eliminar
                      </button>
                    )}
                  </>
                )}
                {simulacro.estado === "PUBLICADO" && (
                  <>
                    <button
                      onClick={() => handleArchive(simulacro.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded transition"
                    >
                      <Archive className="h-3 w-3" />
                      Archivar
                    </button>
                    <button
                      onClick={() => handleDraft(simulacro.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                    >
                      Borrador
                    </button>
                  </>
                )}
                {simulacro.estado === "ARCHIVADO" && (
                  <>
                    <button
                      onClick={() => handleUnarchive(simulacro.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition"
                    >
                      Desarchivar
                    </button>
                    {canDelete(simulacro) && (
                      <button
                        onClick={() => handleDelete(simulacro.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                      >
                        <Trash2 className="h-3 w-3" />
                        Eliminar
                      </button>
                    )}
                  </>
                )}
                {!canDelete(simulacro) && simulacro.estado !== "PUBLICADO" && (
                  <div className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-gray-400">
                    <AlertTriangle className="h-3 w-3" />
                    No eliminable
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
