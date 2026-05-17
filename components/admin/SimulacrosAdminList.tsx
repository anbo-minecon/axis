// components/admin/SimulacrosAdminList.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ClipboardList, CheckCircle2, AlertTriangle, Loader2,
  Trash2, Eye, EyeOff, Archive, RotateCcw, ChevronDown,
  ChevronUp, Layers, BookOpen, Clock, Hash, X, Search,
  Filter, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Tipos ──────────────────────────────────────────────────────────────────
type EstadoExamen = "BORRADOR" | "PUBLICADO" | "CERRADO" | "ARCHIVADO";

interface SesionResumen {
  id: string;
  numero: number;
  nombre: string;
  tiempoMin: number;
}

interface SimulacroAdmin {
  id: string;
  nombre: string;
  materia: string;
  totalPreguntas: number;
  tiempoMin: number;
  estado: EstadoExamen;
  tieneSesiones: boolean;
  triCalculado: boolean;
  fechaDisponible: string | null;
  fechaCierre: string | null;
  createdAt: string;
  sesiones: SesionResumen[];
  _count: { claves: number };
}

// ── Helpers ────────────────────────────────────────────────────────────────
const ESTADO_CONFIG: Record<EstadoExamen, {
  label: string;
  color: string;
  dot: string;
}> = {
  BORRADOR:   { label: "Borrador",   color: "bg-gray-500/20 text-gray-400 border-gray-500/30",   dot: "bg-gray-400"   },
  PUBLICADO:  { label: "Publicado",  color: "bg-green-500/20 text-green-400 border-green-500/30", dot: "bg-green-400"  },
  CERRADO:    { label: "Cerrado",    color: "bg-amber-500/20 text-amber-400 border-amber-500/30", dot: "bg-amber-400"  },
  ARCHIVADO:  { label: "Archivado",  color: "bg-red-500/20 text-red-400 border-red-500/30",       dot: "bg-red-400"    },
};

const MATERIA_COLORS: Record<string, string> = {
  "Matemáticas":           "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Lectura Crítica":       "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Ciencias Naturales":    "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Sociales y Ciudadanas": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Inglés":                "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "Multi-materia":         "bg-violet-500/20 text-violet-400 border-violet-500/30",
};
const getMateriaColor = (m: string) =>
  MATERIA_COLORS[m] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30";

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ── Toast ──────────────────────────────────────────────────────────────────
function Toast({ tipo, msg, onClose }: { tipo: "ok" | "error"; msg: string; onClose: () => void }) {
  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-5 py-3.5 text-sm font-medium shadow-2xl",
      tipo === "ok"
        ? "border-green-500/30 bg-[#0d1526] text-green-400"
        : "border-red-500/30 bg-[#0d1526] text-red-400",
    )}>
      {tipo === "ok"
        ? <CheckCircle2 className="h-4 w-4 shrink-0" />
        : <AlertTriangle className="h-4 w-4 shrink-0" />}
      <span>{msg}</span>
      <button onClick={onClose}><X className="h-3.5 w-3.5 opacity-60 hover:opacity-100" /></button>
    </div>
  );
}

// ── Modal de confirmación ──────────────────────────────────────────────────
function Modal({ titulo, mensaje, confirmLabel, confirmClass, onConfirm, onCancel, loading }: {
  titulo: string; mensaje: string; confirmLabel: string;
  confirmClass?: string; onConfirm: () => void; onCancel: () => void;
  loading?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d1526] shadow-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
          </div>
          <h2 className="text-base font-bold text-white">{titulo}</h2>
        </div>
        <p className="text-sm text-gray-400 leading-relaxed">{mensaje}</p>
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-gray-300 hover:bg-white/10 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn("flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition disabled:opacity-50 flex items-center justify-center gap-2", confirmClass ?? "bg-red-600 hover:bg-red-700")}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Acciones de estado disponibles por estado actual ──────────────────────
function getAcciones(estado: EstadoExamen): {
  label: string; nuevoEstado: EstadoExamen; icon: React.ElementType; cls: string;
}[] {
  switch (estado) {
    case "BORRADOR":
      return [
        { label: "Publicar",  nuevoEstado: "PUBLICADO", icon: Eye,      cls: "text-green-400 hover:bg-green-500/20" },
        { label: "Archivar",  nuevoEstado: "ARCHIVADO", icon: Archive,   cls: "text-red-400 hover:bg-red-500/20" },
      ];
    case "PUBLICADO":
      return [
        { label: "Borrador",  nuevoEstado: "BORRADOR",  icon: EyeOff,   cls: "text-gray-400 hover:bg-white/10" },
        { label: "Cerrar",    nuevoEstado: "CERRADO",   icon: Archive,   cls: "text-amber-400 hover:bg-amber-500/20" },
        { label: "Archivar",  nuevoEstado: "ARCHIVADO", icon: Archive,   cls: "text-red-400 hover:bg-red-500/20" },
      ];
    case "CERRADO":
      return [
        { label: "Publicar",  nuevoEstado: "PUBLICADO", icon: Eye,      cls: "text-green-400 hover:bg-green-500/20" },
        { label: "Archivar",  nuevoEstado: "ARCHIVADO", icon: Archive,   cls: "text-red-400 hover:bg-red-500/20" },
      ];
    case "ARCHIVADO":
      return [
        { label: "Restaurar", nuevoEstado: "BORRADOR",  icon: RotateCcw, cls: "text-blue-400 hover:bg-blue-500/20" },
      ];
    default:
      return [];
  }
}

// ── Card de simulacro ──────────────────────────────────────────────────────
function SimulacroCard({
  sim,
  onCambiarEstado,
  onEliminar,
}: {
  sim: SimulacroAdmin;
  onCambiarEstado: (id: string, estado: EstadoExamen) => void;
  onEliminar: (id: string, nombre: string) => void;
}) {
  const [expandido, setExpandido] = useState(false);
  const cfg     = ESTADO_CONFIG[sim.estado];
  const acciones = getAcciones(sim.estado);

  return (
    <div className={cn(
      "rounded-2xl border bg-[var(--bg-card)] overflow-hidden transition-all",
      sim.estado === "ARCHIVADO" ? "border-white/5 opacity-60" : "border-white/10",
    )}>
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        {/* Info principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {/* Estado */}
            <span className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              cfg.color,
            )}>
              <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
              {cfg.label}
            </span>
            {/* Materia */}
            <span className={cn(
              "inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold",
              getMateriaColor(sim.materia),
            )}>
              {sim.tieneSesiones ? "Multi-materia" : sim.materia}
            </span>
            {/* TRI */}
            {sim.triCalculado && (
              <span className="rounded-full bg-violet-500/20 border border-violet-500/30 px-2 py-0.5 text-[10px] font-semibold text-violet-400">
                TRI ✓
              </span>
            )}
          </div>

          <h3 className="text-sm font-bold text-white truncate">{sim.nombre}</h3>

          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 flex-wrap">
            <span className="flex items-center gap-1">
              <Hash className="h-3 w-3" />
              {sim._count.claves} preguntas
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {sim.tiempoMin} min
            </span>
            {sim.tieneSesiones && (
              <span className="flex items-center gap-1">
                <Layers className="h-3 w-3" />
                {sim.sesiones.length} sesiones
              </span>
            )}
            <span>Creado {fmtFecha(sim.createdAt)}</span>
            {sim.fechaCierre && (
              <span className="text-amber-500">Cierre: {fmtFecha(sim.fechaCierre)}</span>
            )}
          </div>
        </div>

        {/* Botón expandir */}
        <button
          onClick={() => setExpandido((v) => !v)}
          className="shrink-0 rounded-lg p-1.5 text-gray-600 hover:text-white hover:bg-white/10 transition"
        >
          {expandido ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Sesiones expandidas */}
      {expandido && sim.tieneSesiones && sim.sesiones.length > 0 && (
        <div className="border-t border-white/10 px-4 py-3 space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-2">Sesiones</p>
          {sim.sesiones.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-violet-600/30 text-[9px] font-bold text-violet-300">
                {s.numero}
              </div>
              <span className="flex-1 text-xs text-gray-400 truncate">{s.nombre}</span>
              <span className="text-[10px] text-gray-600">{s.tiempoMin} min</span>
            </div>
          ))}
        </div>
      )}

      {/* Acciones */}
      <div className="border-t border-white/10 px-4 py-3 flex items-center gap-2 flex-wrap">
        {acciones.map(({ label, nuevoEstado, icon: Icon, cls }) => (
          <button
            key={nuevoEstado}
            onClick={() => onCambiarEstado(sim.id, nuevoEstado)}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition border border-white/5",
              cls,
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}

        {/* Eliminar solo borradores */}
        {sim.estado === "BORRADOR" && (
          <button
            onClick={() => onEliminar(sim.id, sim.nombre)}
            className="ml-auto flex items-center gap-1.5 rounded-xl border border-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-500/10 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Eliminar
          </button>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════
export function SimulacrosAdminList() {
  const [simulacros,  setSimulacros]  = useState<SimulacroAdmin[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [filtroEstado,setFiltroEstado]= useState<EstadoExamen | "TODOS">("TODOS");
  const [busqueda,    setBusqueda]    = useState("");
  const [toast,       setToast]       = useState<{ tipo: "ok" | "error"; msg: string } | null>(null);

  // Modal cambio estado
  const [modalEstado, setModalEstado] = useState<{
    id: string; nombre: string; nuevoEstado: EstadoExamen;
  } | null>(null);
  const [modalEliminar, setModalEliminar] = useState<{ id: string; nombre: string } | null>(null);
  const [accionLoading, setAccionLoading] = useState(false);

  const showToast = (tipo: "ok" | "error", msg: string) => {
    setToast({ tipo, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const cargar = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/admin/simulacros");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSimulacros(data.examenes ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Error al cargar simulacros.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Cambiar estado (PATCH)
  const confirmarCambioEstado = async () => {
    if (!modalEstado) return;
    setAccionLoading(true);
    try {
      const res  = await fetch(`/api/admin/simulacros/${modalEstado.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ estado: modalEstado.nuevoEstado }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("ok", `Simulacro "${modalEstado.nombre}" → ${modalEstado.nuevoEstado}`);
      setSimulacros((prev) =>
        prev.map((s) => s.id === modalEstado.id ? { ...s, estado: modalEstado.nuevoEstado } : s)
      );
    } catch (e: any) {
      showToast("error", e?.message ?? "Error al cambiar estado.");
    } finally {
      setAccionLoading(false);
      setModalEstado(null);
    }
  };

  // Eliminar (DELETE)
  const confirmarEliminar = async () => {
    if (!modalEliminar) return;
    setAccionLoading(true);
    try {
      const res  = await fetch(`/api/admin/simulacros/${modalEliminar.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("ok", `Simulacro "${modalEliminar.nombre}" eliminado.`);
      setSimulacros((prev) => prev.filter((s) => s.id !== modalEliminar.id));
    } catch (e: any) {
      showToast("error", e?.message ?? "Error al eliminar.");
    } finally {
      setAccionLoading(false);
      setModalEliminar(null);
    }
  };

  // Filtrar
  const filtrados = simulacros.filter((s) => {
    const pasaEstado  = filtroEstado === "TODOS" || s.estado === filtroEstado;
    const pasaBusqueda = !busqueda.trim() ||
      s.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.materia.toLowerCase().includes(busqueda.toLowerCase());
    return pasaEstado && pasaBusqueda;
  });

  // Contadores rápidos
  const contadores: Record<string, number> = {
    TODOS:     simulacros.length,
    BORRADOR:  simulacros.filter((s) => s.estado === "BORRADOR").length,
    PUBLICADO: simulacros.filter((s) => s.estado === "PUBLICADO").length,
    CERRADO:   simulacros.filter((s) => s.estado === "CERRADO").length,
    ARCHIVADO: simulacros.filter((s) => s.estado === "ARCHIVADO").length,
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-5">
      {toast && <Toast tipo={toast.tipo} msg={toast.msg} onClose={() => setToast(null)} />}

      {/* Modal estado */}
      {modalEstado && (
        <Modal
          titulo={`Cambiar a ${ESTADO_CONFIG[modalEstado.nuevoEstado]?.label ?? modalEstado.nuevoEstado}`}
          mensaje={`¿Confirmas cambiar el estado de "${modalEstado.nombre}" a ${ESTADO_CONFIG[modalEstado.nuevoEstado]?.label}?${
            modalEstado.nuevoEstado === "CERRADO"
              ? " Esto calculará los puntajes TRI finales de todos los estudiantes."
              : ""
          }`}
          confirmLabel="Confirmar"
          confirmClass="bg-blue-600 hover:bg-blue-700"
          onConfirm={confirmarCambioEstado}
          onCancel={() => setModalEstado(null)}
          loading={accionLoading}
        />
      )}

      {/* Modal eliminar */}
      {modalEliminar && (
        <Modal
          titulo="Eliminar simulacro"
          mensaje={`¿Eliminar permanentemente "${modalEliminar.nombre}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          confirmClass="bg-red-600 hover:bg-red-700"
          onConfirm={confirmarEliminar}
          onCancel={() => setModalEliminar(null)}
          loading={accionLoading}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold text-white">Gestión de Simulacros</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {simulacros.length} simulacro{simulacros.length !== 1 ? "s" : ""} en total
          </p>
        </div>
        <button
          onClick={cargar}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-white/10 transition disabled:opacity-50"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Actualizar
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o materia…"
          className="w-full rounded-xl border border-white/10 bg-[var(--bg-card)] pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
        />
      </div>

      {/* Filtros de estado */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {(["TODOS", "BORRADOR", "PUBLICADO", "CERRADO", "ARCHIVADO"] as const).map((est) => (
          <button
            key={est}
            onClick={() => setFiltroEstado(est)}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition border",
              filtroEstado === est
                ? "bg-violet-600 text-white border-violet-600"
                : "border-white/10 text-gray-400 hover:text-white hover:border-white/20",
            )}
          >
            {est !== "TODOS" && (
              <span className={cn("h-1.5 w-1.5 rounded-full", ESTADO_CONFIG[est as EstadoExamen]?.dot)} />
            )}
            {est === "TODOS" ? "Todos" : ESTADO_CONFIG[est as EstadoExamen]?.label}
            <span className="ml-0.5 opacity-60">({contadores[est]})</span>
          </button>
        ))}
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-violet-500" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <ClipboardList className="h-12 w-12 text-gray-700" />
          <p className="text-sm font-semibold text-gray-500">
            {busqueda ? "Sin resultados para esa búsqueda." : "No hay simulacros en esta categoría."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map((sim) => (
            <SimulacroCard
              key={sim.id}
              sim={sim}
              onCambiarEstado={(id, estado) => {
                const s = simulacros.find((x) => x.id === id);
                if (s) setModalEstado({ id, nombre: s.nombre, nuevoEstado: estado });
              }}
              onEliminar={(id, nombre) => setModalEliminar({ id, nombre })}
            />
          ))}
        </div>
      )}
    </div>
  );
}