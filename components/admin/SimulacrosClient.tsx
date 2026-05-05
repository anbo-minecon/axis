// components/admin/SimulacrosClient.tsx
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  FileSpreadsheet,
  Plus,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Download,
  Loader2,
  FileUp,
  ClipboardList,
  X,
  MoreVertical,
  Edit2,
  Check,
  Archive,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Tipos ──────────────────────────────────────────────────────────────────────
type Respuesta = "A" | "B" | "C" | "D" | null;
type Tab = "crear" | "importar" | "ver";

interface ExamenTemplate {
  id: string;
  nombre: string;
  materia: string;
  totalPreguntas: number;
  tiempoMin: number;
  estado: "BORRADOR" | "PUBLICADO" | "ARCHIVADO";
  createdAt: string;
  _count: { claves: number };
}

interface ClaveRespuesta {
  numero: number;
  respuesta: Respuesta;
}

// ── Constantes ────────────────────────────────────────────────────────────────
const MATERIAS = [
  "Matemáticas",
  "Lectura Crítica",
  "Ciencias Naturales",
  "Sociales y Ciudadanas",
  "Inglés",
];

// Mapeo de materias a imágenes por defecto
const MATERIA_IMAGEN_MAP: Record<string, string> = {
  "Matemáticas": "/images/simulacro/matematicas.jpg",
  "Lectura Crítica": "/images/simulacro/lectura-critica.jpg",
  "Ciencias Naturales": "/images/simulacro/ciencias-naturales.jpg",
  "Sociales y Ciudadanas": "/images/simulacro/sociales-ciudadanas.jpg",
  "Inglés": "/images/simulacro/ingles.jpg",
};

const getImagenSimulacro = (materia: string): string => {
  return MATERIA_IMAGEN_MAP[materia] || "/images/simulacro/default.jpg";
};

const makeClaves = (desde: number, cantidad: number): ClaveRespuesta[] =>
  Array.from({ length: cantidad }, (_, i) => ({
    numero: desde + i,
    respuesta: null,
  }));

// ── Utilidad: estilos de input ─────────────────────────────────────────────
const inputCls =
  "w-full rounded-xl border border-white/10 bg-[var(--bg-secondary)] px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition";

// ══════════════════════════════════════════════════════════════════════════════
// SECCIÓN: CREAR SIMULACRO
// ══════════════════════════════════════════════════════════════════════════════
function CrearSimulacroForm() {
  const [nombre, setNombre] = useState("");
  const [materia, setMateria] = useState("");
  const [totalPreguntas, setTotalPreguntas] = useState(50);
  const [tiempoMin, setTiempoMin] = useState(120);
  const [claves, setClaves] = useState<ClaveRespuesta[]>(makeClaves(1, 10));
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ tipo: "ok" | "error"; msg: string } | null>(null);

  const respuestasDefinidas = claves.filter((c) => c.respuesta !== null).length;

  const showToast = (tipo: "ok" | "error", msg: string) => {
    setToast({ tipo, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const toggleRespuesta = (numero: number, op: "A" | "B" | "C" | "D") => {
    setClaves((prev) =>
      prev.map((c) =>
        c.numero === numero
          ? { ...c, respuesta: c.respuesta === op ? null : op }
          : c
      )
    );
  };

  const agregarPreguntas = (n: number) => {
    setClaves((prev) => [...prev, ...makeClaves(prev.length + 1, n)]);
  };

  const eliminarPregunta = (numero: number) => {
    setClaves((prev) =>
      prev
        .filter((c) => c.numero !== numero)
        .map((c, i) => ({ ...c, numero: i + 1 }))
    );
  };

  const handleGuardar = async (estado: "BORRADOR" | "PUBLICADO") => {
    if (!nombre.trim()) return showToast("error", "El nombre del simulacro es obligatorio.");
    if (!materia) return showToast("error", "Selecciona una materia.");
    if (respuestasDefinidas === 0) return showToast("error", "Define al menos una respuesta correcta.");

    setLoading(true);
    try {
      const res = await fetch("/api/admin/simulacros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, materia, totalPreguntas, tiempoMin, claves, estado }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", data.error ?? "Error al guardar el simulacro.");
        return;
      }
      showToast(
        "ok",
        estado === "PUBLICADO"
          ? "Simulacro publicado exitosamente."
          : "Guardado como borrador."
      );
      // Reset form
      setNombre("");
      setMateria("");
      setTotalPreguntas(50);
      setTiempoMin(120);
      setClaves(makeClaves(1, 10));
    } catch {
      showToast("error", "Error de conexión. Verifica tu red.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium",
            toast.tipo === "ok"
              ? "border-green-500/30 bg-green-500/10 text-green-400"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          )}
        >
          {toast.tipo === "ok" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          )}
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-auto opacity-60 hover:opacity-100">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Información general ── */}
      <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] p-6 space-y-5">
        <h2 className="text-base font-bold text-white">Información general</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Nombre */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">
              Nombre del simulacro <span className="text-red-400">*</span>
            </label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Simulacro #9"
              className={inputCls}
              disabled={loading}
            />
          </div>

          {/* Materia */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">
              Materia <span className="text-red-400">*</span>
            </label>
            <select
              value={materia}
              onChange={(e) => setMateria(e.target.value)}
              className={cn(inputCls, "appearance-none cursor-pointer")}
              disabled={loading}
            >
              <option value="">Seleccionar materia</option>
              {MATERIAS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Total preguntas */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">
              Total de preguntas
            </label>
            <input
              type="number"
              value={totalPreguntas}
              onChange={(e) => setTotalPreguntas(Math.max(1, Number(e.target.value)))}
              min={1}
              className={inputCls}
              disabled={loading}
            />
          </div>

          {/* Tiempo límite */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">
              Tiempo límite (minutos)
            </label>
            <input
              type="number"
              value={tiempoMin}
              onChange={(e) => setTiempoMin(Math.max(1, Number(e.target.value)))}
              min={1}
              className={inputCls}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* ── Clave de respuestas ── */}
      <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white">Clave de respuestas correctas</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {respuestasDefinidas} de {claves.length} respuestas definidas
            </p>
          </div>
          <button
            onClick={() => agregarPreguntas(10)}
            disabled={loading}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-400 hover:bg-blue-500/20 transition disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            +10 preguntas
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-300"
            style={{
              width: `${claves.length > 0 ? (respuestasDefinidas / claves.length) * 100 : 0}%`,
            }}
          />
        </div>

        {/* Grid de preguntas */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {claves.map(({ numero, respuesta }) => (
            <div
              key={numero}
              className="rounded-xl border border-white/10 bg-[var(--bg-secondary)] p-3 space-y-2.5"
            >
              {/* Número + eliminar */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-300">P{numero}</span>
                <button
                  onClick={() => eliminarPregunta(numero)}
                  disabled={loading}
                  className="text-gray-600 hover:text-red-400 transition disabled:opacity-30"
                  title="Eliminar pregunta"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>

              {/* Botones A B C D */}
              <div className="grid grid-cols-2 gap-1.5">
                {(["A", "B", "C", "D"] as const).map((op) => (
                  <button
                    key={op}
                    onClick={() => toggleRespuesta(numero, op)}
                    disabled={loading}
                    className={cn(
                      "rounded-lg py-1.5 text-xs font-bold transition-all",
                      respuesta === op
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-700/50"
                        : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {op}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Agregar más */}
        <div className="flex items-center gap-2 flex-wrap">
          {[5, 10, 25].map((n) => (
            <button
              key={n}
              onClick={() => agregarPreguntas(n)}
              disabled={loading}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-white/10 transition disabled:opacity-50"
            >
              + {n} más
            </button>
          ))}
        </div>
      </div>

      {/* ── Footer stats ── */}
      <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] px-5 py-3.5 flex items-center gap-2 text-sm text-gray-500 flex-wrap">
        <FileSpreadsheet className="h-4 w-4 text-blue-400 shrink-0" />
        <span className="text-gray-300">{claves.length} preguntas</span>
        <span className="text-white/20">·</span>
        <span>{respuestasDefinidas} respuestas definidas</span>
        <span className="text-white/20">·</span>
        <span>{tiempoMin} minutos</span>
      </div>

      {/* ── Acciones ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => handleGuardar("BORRADOR")}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-gray-300 hover:bg-white/10 transition disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Guardar borrador
        </button>
        <button
          onClick={() => handleGuardar("PUBLICADO")}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Publicar simulacro
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECCIÓN: IMPORTAR DESDE EXCEL
// ══════════════════════════════════════════════════════════════════════════════
function ImportarExcelForm() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    importados: number;
    errores: number;
    mensajes: string[];
  } | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptFile = (f: File | undefined) => {
    if (!f) return;
    if (!f.name.match(/\.(xlsx|xls)$/i)) {
      setError("Solo se aceptan archivos .xlsx o .xls");
      return;
    }
    setFile(f);
    setError("");
    setResult(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    acceptFile(e.dataTransfer.files[0]);
  }, []);

  const handleImportar = async () => {
    if (!file) { setError("Selecciona un archivo Excel primero."); return; }
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/simulacros/importar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al importar el archivo."); return; }
      setResult(data);
      setFile(null);
    } catch {
      setError("Error de conexión. Verifica tu red.");
    } finally {
      setLoading(false);
    }
  };

  // Descargar plantilla CSV/Excel básica como descarga del cliente
  const descargarPlantilla = () => {
    const csv = "simulacro,materia,pregunta,respuesta_correcta\n1,matemáticas,1,B\n1,matemáticas,2,D\n1,matemáticas,3,A";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_simulacro.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* ── Formato del archivo ── */}
      <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-white">Formato requerido del archivo</h2>
          <p className="text-xs text-gray-500 mt-1">
            El archivo Excel debe contener exactamente estas columnas:
          </p>
        </div>

        {/* Tabla de ejemplo */}
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                {["simulacro", "materia", "pregunta", "respuesta_correcta"].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-2.5 text-left text-xs font-semibold text-blue-400"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                ["1", "matemáticas", "1", "B"],
                ["1", "matemáticas", "2", "D"],
                ["1", "matemáticas", "3", "A"],
              ].map((row, i) => (
                <tr key={i} className="hover:bg-white/5 transition">
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className={cn(
                        "px-4 py-2.5 text-xs",
                        j === 3 ? "font-bold text-blue-400" : "text-gray-300"
                      )}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={descargarPlantilla}
          className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition"
        >
          <Download className="h-3.5 w-3.5" />
          Descargar plantilla Excel
        </button>
      </div>

      {/* ── Chips de validación ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          {
            icon: CheckCircle2,
            color: "border-green-500/20 bg-green-500/10 text-green-400",
            text: "Las columnas deben tener exactamente esos nombres.",
          },
          {
            icon: CheckCircle2,
            color: "border-green-500/20 bg-green-500/10 text-green-400",
            text: "Las respuestas válidas son: A, B, C o D (mayúsculas).",
          },
          {
            icon: AlertTriangle,
            color: "border-amber-400/20 bg-amber-400/10 text-amber-400",
            text: "Filas incompletas o con errores serán rechazadas.",
          },
        ].map(({ icon: Icon, color, text }, i) => (
          <div
            key={i}
            className={cn(
              "flex items-start gap-2.5 rounded-xl border px-3 py-3",
              color
            )}
          >
            <Icon className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="text-xs leading-relaxed">{text}</span>
          </div>
        ))}
      </div>

      {/* ── Zona de drop ── */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !loading && inputRef.current?.click()}
        className={cn(
          "rounded-2xl border-2 border-dashed cursor-pointer transition-all py-14 flex flex-col items-center justify-center gap-3",
          loading && "pointer-events-none opacity-60",
          dragging
            ? "border-blue-500 bg-blue-500/10"
            : file
            ? "border-green-500/50 bg-green-500/5"
            : "border-white/10 bg-[var(--bg-card)] hover:border-blue-500/40 hover:bg-blue-500/5"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => acceptFile(e.target.files?.[0])}
        />

        {file ? (
          <>
            <CheckCircle2 className="h-10 w-10 text-green-400" />
            <div className="text-center">
              <p className="text-sm font-semibold text-green-400">{file.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {(file.size / 1024).toFixed(1)} KB — listo para importar
              </p>
            </div>
          </>
        ) : (
          <>
            <FileUp className="h-10 w-10 text-gray-600" />
            <div className="text-center">
              <p className="text-sm font-semibold text-white">Arrastra tu archivo aquí</p>
              <p className="text-xs text-gray-500 mt-1">o haz clic para seleccionar</p>
            </div>
            <div
              onClick={(e) => e.stopPropagation()}
              className="pointer-events-none"
            >
              <span className="pointer-events-auto flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition cursor-pointer">
                <Upload className="h-4 w-4" />
                Seleccionar archivo Excel
              </span>
            </div>
            <p className="text-xs text-gray-600">Formatos aceptados: .xlsx, .xls</p>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError("")} className="ml-auto opacity-60 hover:opacity-100">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Resultado */}
      {result && (
        <div className="rounded-2xl border border-green-500/30 bg-green-500/10 px-5 py-4 space-y-2">
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <p className="text-sm font-semibold">Importación completada</p>
          </div>
          <p className="text-xs text-gray-400">
            {result.importados} registros importados
            {result.errores > 0 && (
              <span className="text-amber-400"> · {result.errores} filas con errores</span>
            )}
          </p>
          {result.mensajes?.length > 0 && (
            <ul className="mt-2 space-y-1 border-t border-white/10 pt-2">
              {result.mensajes.map((m, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-amber-400">
                  <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                  {m}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Botones de acción */}
      {file && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setFile(null); setError(""); }}
            disabled={loading}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-gray-300 hover:bg-white/10 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleImportar}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {loading ? "Importando…" : "Importar simulacro"}
          </button>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECCIÓN: VER SIMULACROS CREADOS
// ══════════════════════════════════════════════════════════════════════════════
interface ExamenTemplateEditando extends ExamenTemplate {
  claves?: Array<{ id: string; numeroPregunta: number; respuesta: string }>;
}

function ListarSimulacrosForm() {
  const [simulacros, setSimulacros] = useState<ExamenTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "BORRADOR" | "PUBLICADO" | "ARCHIVADO">("todos");
  
  // Modal de edición
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editandoData, setEditandoData] = useState<ExamenTemplateEditando | null>(null);
  const [loadingEditar, setLoadingEditar] = useState(false);
  const [errorEditar, setErrorEditar] = useState("");
  const [toastEditar, setToastEditar] = useState<{ tipo: "ok" | "error"; msg: string } | null>(null);
  
  // Dropdown
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Cargar simulacros
  useEffect(() => {
    const cargarSimulacros = async () => {
      try {
        setLoading(true);
        setError("");
        const query = filtroEstado !== "todos" ? `?estado=${filtroEstado}` : "";
        const res = await fetch(`/api/admin/simulacros${query}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Error al cargar simulacros");
          return;
        }
        setSimulacros(data.examenes || []);
      } catch {
        setError("Error de conexión al cargar simulacros");
      } finally {
        setLoading(false);
      }
    };

    cargarSimulacros();
  }, [filtroEstado]);

  // Cargar simulacro para editar
  const cargarParaEditar = async (id: string) => {
    try {
      setLoadingEditar(true);
      const res = await fetch(`/api/admin/simulacros/${id}`);
      const data = await res.json();
      if (!res.ok) {
        setErrorEditar(data.error ?? "Error al cargar simulacro");
        return;
      }
      setEditandoData(data.examen);
      setEditandoId(id);
      setOpenMenuId(null);
    } catch {
      setErrorEditar("Error de conexión");
    } finally {
      setLoadingEditar(false);
    }
  };

  // Publicar simulacro
  const publicarSimulacro = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/simulacros/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "PUBLICADO" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al publicar");
        return;
      }
      // Refrescar lista
      const query = filtroEstado !== "todos" ? `?estado=${filtroEstado}` : "";
      const resList = await fetch(`/api/admin/simulacros${query}`);
      const dataList = await resList.json();
      setSimulacros(dataList.examenes || []);
      setOpenMenuId(null);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  // Guardar cambios en edición
  const guardarCambios = async () => {
    if (!editandoData || !editandoId) return;

    try {
      setLoadingEditar(true);
      setErrorEditar("");
      
      // Preparar claves
      const clavesParaEnviar = editandoData.claves
        ? editandoData.claves
            .filter((c) => c.respuesta)
            .map((c) => ({
              numeroPregunta: c.numeroPregunta,
              respuesta: c.respuesta,
            }))
        : [];

      const res = await fetch(`/api/admin/simulacros/${editandoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: editandoData.nombre,
          materia: editandoData.materia,
          totalPreguntas: editandoData.totalPreguntas,
          tiempoMin: editandoData.tiempoMin,
          claves: clavesParaEnviar,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorEditar(data.error ?? "Error al guardar cambios");
        return;
      }

      setToastEditar({ tipo: "ok", msg: "Simulacro actualizado exitosamente" });
      setTimeout(() => setToastEditar(null), 3000);

      // Refrescar lista
      const query = filtroEstado !== "todos" ? `?estado=${filtroEstado}` : "";
      const resList = await fetch(`/api/admin/simulacros${query}`);
      const dataList = await resList.json();
      setSimulacros(dataList.examenes || []);

      // Cerrar modal
      setTimeout(() => setEditandoId(null), 500);
    } catch {
      setErrorEditar("Error de conexión");
    } finally {
      setLoadingEditar(false);
    }
  };

  // Eliminar simulacro
  const eliminarSimulacro = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este simulacro?")) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/admin/simulacros/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al eliminar");
        return;
      }

      // Refrescar lista
      const query = filtroEstado !== "todos" ? `?estado=${filtroEstado}` : "";
      const resList = await fetch(`/api/admin/simulacros${query}`);
      const dataList = await resList.json();
      setSimulacros(dataList.examenes || []);
      setOpenMenuId(null);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case "PUBLICADO":
        return "bg-green-500/10 text-green-400 border-green-500/30";
      case "BORRADOR":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
      case "ARCHIVADO":
        return "bg-gray-500/10 text-gray-400 border-gray-500/30";
      default:
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Controles ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {["todos", "BORRADOR", "PUBLICADO", "ARCHIVADO"].map((estado) => (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado as any)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition",
                filtroEstado === estado
                  ? "bg-blue-600 text-white"
                  : "bg-white/10 text-gray-300 hover:bg-white/20"
              )}
            >
              {estado === "todos" ? "Todos" : estado}
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-400">
          {simulacros.length} simulacro{simulacros.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
        </div>
      )}

      {/* ── Error ── */}
      {error && !loading && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError("")} className="ml-auto opacity-60 hover:opacity-100">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Lista de simulacros ── */}
      {!loading && simulacros.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[var(--bg-card)] px-6 py-12 text-center">
          <FileSpreadsheet className="mx-auto h-10 w-10 text-gray-500 mb-3" />
          <p className="text-gray-400">No hay simulacros creados en esta categoría</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {simulacros.map((simulacro) => (
            <div
              key={simulacro.id}
              className="group rounded-2xl border border-white/10 bg-[var(--bg-card)] overflow-hidden hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10 relative"
            >
              {/* Imagen */}
              <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-blue-900/30 to-purple-900/30">
                <img
                  src={getImagenSimulacro(simulacro.materia)}
                  alt={simulacro.materia}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>

              {/* Botón de menú (esquina superior derecha) */}
              <div className="absolute top-3 right-3">
                <div className="relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === simulacro.id ? null : simulacro.id)}
                    className="p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-gray-300 hover:text-white transition"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {openMenuId === simulacro.id && (
                    <div className="absolute right-0 mt-1 w-32 rounded-lg border border-white/10 bg-[var(--bg-card)] shadow-lg z-50">
                      {simulacro.estado === "BORRADOR" && (
                        <>
                          <button
                            onClick={() => cargarParaEditar(simulacro.id)}
                            disabled={loadingEditar}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-blue-600/20 transition text-left rounded-t-lg disabled:opacity-50"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            Editar
                          </button>
                          <button
                            onClick={() => publicarSimulacro(simulacro.id)}
                            disabled={loading}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-400 hover:bg-green-600/20 transition text-left disabled:opacity-50"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Publicar
                          </button>
                          <button
                            onClick={() => eliminarSimulacro(simulacro.id)}
                            disabled={loading}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-600/20 transition text-left rounded-b-lg disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Eliminar
                          </button>
                        </>
                      )}
                      {simulacro.estado === "PUBLICADO" && (
                        <>
                          <button
                            onClick={() => cargarParaEditar(simulacro.id)}
                            disabled={loadingEditar}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-blue-600/20 transition text-left rounded-t-lg disabled:opacity-50"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            Editar
                          </button>
                          <button
                            onClick={() => {
                              setOpenMenuId(null);
                              // Puedes agregar funcionalidad de archivar aquí
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:bg-gray-600/20 transition text-left rounded-b-lg"
                          >
                            <Archive className="h-3.5 w-3.5" />
                            Archivar
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Contenido */}
              <div className="p-4 space-y-3">
                {/* Encabezado */}
                <div className="space-y-1">
                  <h3 className="font-semibold text-white truncate">{simulacro.nombre}</h3>
                  <p className="text-xs text-gray-400">{simulacro.materia}</p>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-lg bg-white/5 p-2 text-center">
                    <p className="font-semibold text-blue-400">{simulacro.totalPreguntas}</p>
                    <p className="text-gray-500">preguntas</p>
                  </div>
                  <div className="rounded-lg bg-white/5 p-2 text-center">
                    <p className="font-semibold text-blue-400">{simulacro._count.claves}</p>
                    <p className="text-gray-500">claves</p>
                  </div>
                  <div className="rounded-lg bg-white/5 p-2 text-center">
                    <p className="font-semibold text-blue-400">{simulacro.tiempoMin}</p>
                    <p className="text-gray-500">minutos</p>
                  </div>
                </div>

                {/* Estado y fecha */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-xs font-medium",
                      getEstadoBadgeColor(simulacro.estado)
                    )}
                  >
                    {simulacro.estado}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(simulacro.createdAt).toLocaleDateString("es-CO")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal de Edición ── */}
      {editandoId && editandoData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl border border-white/10 bg-[var(--bg-card)] max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-5 p-6">
            {/* Toast */}
            {toastEditar && (
              <div
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium",
                  toastEditar.tipo === "ok"
                    ? "border-green-500/30 bg-green-500/10 text-green-400"
                    : "border-red-500/30 bg-red-500/10 text-red-400"
                )}
              >
                {toastEditar.tipo === "ok" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                )}
                <span>{toastEditar.msg}</span>
              </div>
            )}

            {/* Encabezado */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Editar Simulacro</h2>
              <button
                onClick={() => setEditandoId(null)}
                className="p-1 hover:bg-white/10 rounded-lg transition"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {errorEditar && (
              <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorEditar}</span>
              </div>
            )}

            {/* Formulario */}
            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre del Simulacro
                </label>
                <input
                  type="text"
                  value={editandoData.nombre}
                  onChange={(e) =>
                    setEditandoData({ ...editandoData, nombre: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Materia */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Materia
                </label>
                <select
                  value={editandoData.materia}
                  onChange={(e) =>
                    setEditandoData({ ...editandoData, materia: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {MATERIAS.map((m) => (
                    <option key={m} value={m} className="bg-gray-900">
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Total de Preguntas y Tiempo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Total de Preguntas
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editandoData.totalPreguntas}
                    onChange={(e) =>
                      setEditandoData({
                        ...editandoData,
                        totalPreguntas: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Duración (minutos)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editandoData.tiempoMin}
                    onChange={(e) =>
                      setEditandoData({
                        ...editandoData,
                        tiempoMin: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Resumen de claves */}
              {editandoData.claves && editandoData.claves.length > 0 && (
                <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-3">
                  <p className="text-sm text-blue-400">
                    {editandoData.claves.filter((c) => c.respuesta).length} claves de respuesta definidas
                  </p>
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => setEditandoId(null)}
                disabled={loadingEditar}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-gray-300 hover:bg-white/10 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={guardarCambios}
                disabled={loadingEditar}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loadingEditar && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export function SimulacrosClient() {
  const [tab, setTab] = useState<Tab>("crear");

  const tabs: { id: Tab; label: string; icon: React.ElementType; desc: string }[] = [
    {
      id: "crear",
      label: "Crear Simulacro",
      icon: ClipboardList,
      desc: "Define la estructura y las respuestas correctas del simulacro.",
    },
    {
      id: "importar",
      label: "Importar desde Excel",
      icon: FileSpreadsheet,
      desc: "Carga las respuestas correctas en masa mediante un archivo Excel estructurado.",
    },
    {
      id: "ver",
      label: "Ver Simulacros",
      icon: FileSpreadsheet,
      desc: "Visualiza todos los simulacros creados y su estado.",
    },
  ];

  const active = tabs.find((t) => t.id === tab)!;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-extrabold text-white">{active.label}</h1>
        <p className="text-sm text-gray-500 mt-1">{active.desc}</p>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-[var(--bg-card)] p-1.5">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
              tab === id
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Contenido ── */}
      {tab === "crear" ? (
        <CrearSimulacroForm />
      ) : tab === "importar" ? (
        <ImportarExcelForm />
      ) : (
        <ListarSimulacrosForm />
      )}
    </div>
  );
}