"use client";

// components/developer/DeveloperSimulacroEdit.tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Search, Edit, Check, X } from "lucide-react";

interface ClavePregunta {
  id: string;
  numeroPregunta: number;
  respuesta: string | null;
  area: string | null;
  dificultad: string | null;
  sesionId: string | null;
}

interface SimulacroData {
  id: string;
  nombre: string;
  materia: string;
  totalPreguntas: number;
  tiempoMin: number;
  estado: string;
  claves: ClavePregunta[];
  sesiones: any[];
}

const ANSWER_OPTIONS_AD = ["A", "B", "C", "D"] as const;
const ANSWER_OPTIONS_AH = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;

export function DeveloperSimulacroEdit({ simulacroId }: { simulacroId: string }) {
  const router = useRouter();
  const [simulacro, setSimulacro] = useState<SimulacroData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingClave, setEditingClave] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  useEffect(() => {
    fetchSimulacro();
  }, [simulacroId]);

  const fetchSimulacro = async () => {
    try {
      const token = localStorage.getItem("developer_token");
      const res = await fetch(`/api/developer/simulacros/${simulacroId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setSimulacro(data.simulacro);
      }
    } catch (error) {
      console.error("Error fetching simulacro:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAnswerOptions = (area: string | null) => {
    return area === "INGLES" ? ANSWER_OPTIONS_AH : ANSWER_OPTIONS_AD;
  };

  const filteredClaves = simulacro?.claves.filter((c) =>
    c.numeroPregunta.toString().includes(searchTerm)
  ) || [];

  const handleEdit = (clave: ClavePregunta) => {
    setEditingClave(clave.id);
    setEditValue(clave.respuesta || "");
  };

  const handleSave = async (claveId: string) => {
    setSaving(true);
    try {
      const token = localStorage.getItem("developer_token");
      const res = await fetch(`/api/developer/simulacros/${simulacroId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          claves: [{ id: claveId, respuesta: editValue }],
        }),
      });

      if (res.ok) {
        await fetchSimulacro();
        setEditingClave(null);
        setEditValue("");
      } else {
        alert("Error al guardar");
      }
    } catch (error) {
      console.error("Error saving:", error);
      alert("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingClave(null);
    setEditValue("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-gray-500">Cargando simulacro...</div>
      </div>
    );
  }

  if (!simulacro) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">Simulacro no encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {simulacro.nombre}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {simulacro.materia} • {simulacro.totalPreguntas} preguntas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            simulacro.estado === "PUBLICADO" ? "bg-green-100 text-green-700" :
            simulacro.estado === "BORRADOR" ? "bg-yellow-100 text-yellow-700" :
            "bg-gray-100 text-gray-700"
          }`}>
            {simulacro.estado}
          </span>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por número de pregunta..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      {/* Grid de preguntas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClaves.map((clave) => {
          const options = getAnswerOptions(clave.area);
          const isEditing = editingClave === clave.id;

          return (
            <div
              key={clave.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Pregunta {clave.numeroPregunta}
                </h3>
                {clave.area && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {clave.area}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {options.map((op) => {
                  const isSelected = clave.respuesta === op;
                  const isEditSelected = editValue === op;

                  return (
                    <button
                      key={op}
                      disabled={!isEditing}
                      onClick={() => isEditing && setEditValue(op)}
                      className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition ${
                        isEditing
                          ? isEditSelected
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                          : isSelected
                            ? "bg-green-100 text-green-700 text-green-700"
                            : "bg-gray-50 dark:bg-gray-700/50 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {op}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                {clave.dificultad && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {clave.dificultad}
                  </span>
                )}
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSave(clave.id)}
                      disabled={saving}
                      className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition"
                      title="Guardar"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleCancel}
                      className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                      title="Cancelar"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEdit(clave)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                    title="Editar respuesta"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredClaves.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No se encontraron preguntas
          </p>
        </div>
      )}
    </div>
  );
}
