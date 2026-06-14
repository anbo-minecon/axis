// components/docente/SimulacrosDocenteClient.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ClipboardList, CheckCircle2, AlertTriangle, Loader2,
  ChevronDown, ChevronUp, Layers, Clock, Hash, X,
  Search, RefreshCw, Pencil, Users, Eye, Archive,
  Save, Calendar, Info, CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Tipos ──────────────────────────────────────────────────────────────────
type EstadoExamen = "PUBLICADO" | "CERRADO";

interface SesionResumen {
  id:       string;
  numero:   number;
  nombre:   string;
  tiempoMin: number;
}

interface Simulacro {
  id:              string;
  nombre:          string;
  materia:         string;
  totalPreguntas:  number;
  tiempoMin:       number;
  estado:          EstadoExamen;
  tieneSesiones:   boolean;
  triCalculado:    boolean;
  fechaDisponible: string | null;
  fechaCierre:     string | null;
  createdAt:       string;
  sesiones:        SesionResumen[];
  _count: { claves: number; resultados: number };
}

// ── Helpers ────────────────────────────────────────────────────────────────
const ESTADO_CONFIG: Record<EstadoExamen, { label: string; color: string; dot: string }> = {
  PUBLICADO: { label: "Publicado", color: "bg-green-500/20 text-green-400 border-green-500/30", dot: "bg-green-400"  },
  CERRADO:   { label: "Cerrado",   color: "bg-amber-500/20 text-amber-400 border-amber-500/30", dot: "bg-amber-400"  },
};

const MATERIA_COLORS: Record<string, string> = {
  "Matemáticas":           "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Lectura Crítica":       "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Ciencias Naturales":    "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Sociales y Ciudadanas": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Inglés":                "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "Multi-materia":         "bg-violet-500/20 text-violet-400 border-violet-500/30",
};
const getMC = (m: string) => MATERIA_COLORS[m] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30";

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

const inputCls = "w-full rounded-xl border border-white/10 bg-[var(--bg-secondary)] px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition";

// ── Toast ──────────────────────────────────────────────────────────────────
function Toast({ tipo, msg, onClose }: { tipo: "ok" | "error"; msg: string; onClose: () => void }) {
  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-[300] flex items-center gap-3 rounded-2xl border px-5 py-3.5 text-sm font-medium shadow-2xl",
      tipo === "ok" ? "border-green-500/30 bg-[#0d1526] text-green-400" : "border-red-500/30 bg-[#0d1526] text-red-400",
    )}>
      {tipo === "ok" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
      <span>{msg}</span>
      <button onClick={onClose}><X className="h-3.5 w-3.5 opacity-60 hover:opacity-100" /></button>
    </div>
  );
}

// ── Modal confirmación ─────────────────────────────────────────────────────
function ModalConfirm({ titulo, mensaje, confirmLabel, onConfirm, onCancel, loading }: {
  titulo: string; mensaje: string; confirmLabel: string;
  onConfirm: () => void; onCancel: () => void; loading?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d1526] p-6 space-y-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
          </div>
          <h2 className="text-base font-bold text-white">{titulo}</h2>
        </div>
        <p className="text-sm text-gray-400 leading-relaxed">{mensaje}</p>
        <div className="flex gap-3 pt-1">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-gray-300 hover:bg-white/10 transition disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 rounded-xl bg-amber-600 hover:bg-amber-700 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal editar ───────────────────────────────────────────────────────────
function ModalEditar({ sim, onClose, onGuardado }: {
  sim: Simulacro;
  onClose: () => void;
  onGuardado: (datos: Partial<Simulacro>) => void;
}) {
  const [nombre,          setNombre]          = useState(sim.nombre);
  const [tiempoMin,       setTiempoMin]       = useState(sim.tiempoMin);
  const [fechaDisponible, setFechaDisponible] = useState(sim.fechaDisponible ? sim.fechaDisponible.slice(0, 16) : "");
  const [fechaCierre,     setFechaCierre]     = useState(sim.fechaCierre     ? sim.fechaCierre.slice(0, 16)     : "");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const normFecha = (f: string) =>
    f && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(f) ? `${f}:00.000Z` : f || null;

  const handleGuardar = async () => {
    if (!nombre.trim()) { setError("El nombre es obligatorio."); return; }
    setLoading(true); setError("");
    try {
      const res  = await fetch(`/api/docente/simulacros/${sim.id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          nombre,
          tiempoMin,
          fechaDisponible: normFecha(fechaDisponible),
          fechaCierre:     normFecha(fechaCierre),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al guardar.");
      onGuardado({ nombre, tiempoMin, fechaDisponible: fechaDisponible || null, fechaCierre: fechaCierre || null });
    } catch (e: any) {
      setError(e?.message ?? "Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d1526] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-green-400" />
            <h2 className="text-base font-bold text-white">Editar simulacro</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}

          {/* Info — no puede cambiar materia ni claves */}
          <div className="flex items-start gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3">
            <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-300">
              Como docente puedes editar el nombre, tiempo límite y fechas. La materia y las claves de
              respuestas solo pueden modificarlas los administradores.
            </p>
          </div>

          {/* Materia (solo lectura) */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Materia (solo lectura)</label>
            <div className="flex items-center gap-2">
              <span className={cn("inline-block rounded-full border px-3 py-1 text-xs font-semibold", getMC(sim.materia))}>
                {sim.materia}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Nombre */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                Nombre <span className="text-red-400">*</span>
              </label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)}
                className={inputCls} disabled={loading} />
            </div>

            {/* Tiempo */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                <Clock className="inline h-3 w-3 mr-1" />Tiempo total (min)
              </label>
              <input type="number" value={tiempoMin} min={1}
                onChange={(e) => setTiempoMin(Math.max(1, Number(e.target.value)))}
                className={inputCls} disabled={loading} />
            </div>

            {/* Fecha disponible */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                <Calendar className="inline h-3 w-3 mr-1" />Fecha disponible
              </label>
              <input type="datetime-local" value={fechaDisponible}
                onChange={(e) => setFechaDisponible(e.target.value)}
                className={inputCls} disabled={loading} />
            </div>

            {/* Fecha cierre */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                <Calendar className="inline h-3 w-3 mr-1" />Fecha cierre TRI
              </label>
              <input type="datetime-local" value={fechaCierre}
                onChange={(e) => setFechaCierre(e.target.value)}
                className={inputCls} disabled={loading} />
              <p className="text-[10px] text-gray-600 mt-1">
                Al llegar esta fecha el sistema recalifica automáticamente con TRI.
              </p>
            </div>
          </div>

          {/* Sesiones solo lectura */}
          {sim.tieneSesiones && sim.sesiones.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">
                Sesiones (solo lectura)
              </label>
              <div className="space-y-1.5">
                {sim.sesiones.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/5 px-3 py-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-green-600/30 text-[9px] font-bold text-green-300">
                      {s.numero}
                    </div>
                    <span className="flex-1 text-xs text-gray-400 truncate">{s.nombre}</span>
                    <span className="text-[10px] text-gray-600">{s.tiempoMin} min</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 shrink-0">
          <button onClick={onClose} disabled={loading}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-gray-300 hover:bg-white/10 transition disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={handleGuardar} disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-green-700 hover:bg-green-600 px-5 py-2.5 text-sm font-bold text-white transition disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Card de simulacro ──────────────────────────────────────────────────────
function SimulacroCard({
  sim,
  onEditar,
  onCerrar,
  onActualizar,
}: {
  sim: Simulacro;
  onEditar:     (s: Simulacro) => void;
  onCerrar:     (s: Simulacro) => void;
  onActualizar: (id: string, datos: Partial<Simulacro>) => void;
}) {
  const [expandido, setExpandido] = useState(false);
  const cfg = ESTADO_CONFIG[sim.estado];

  return (
    <div className={cn(
      "rounded-2xl border bg-[var(--bg-card)] overflow-hidden transition-all hover:border-white/20",
      sim.estado === "CERRADO" ? "border-white/8 opacity-80" : "border-white/10",
    )}>
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              cfg.color,
            )}>
              <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
              {cfg.label}
            </span>
            <span className={cn("inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold", getMC(sim.materia))}>
              {sim.tieneSesiones ? "Multi-materia" : sim.materia}
            </span>
            {sim.triCalculado && (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/20 border border-violet-500/30 px-2 py-0.5 text-[9px] font-bold text-violet-400">
                <CheckCheck className="h-2.5 w-2.5" />TRI ✓
              </span>
            )}
          </div>

          <h3 className="text-sm font-bold text-white truncate">{sim.nombre}</h3>

          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 flex-wrap">
            <span className="flex items-center gap-1"><Hash className="h-3 w-3" />{sim._count.claves} preguntas</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{sim.tiempoMin} min</span>
            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{sim._count.resultados} participantes</span>
            {sim.tieneSesiones && (
              <span className="flex items-center gap-1"><Layers className="h-3 w-3" />{sim.sesiones.length} sesiones</span>
            )}
            {sim.fechaCierre && (
              <span className="text-amber-500">Cierre: {fmtFecha(sim.fechaCierre)}</span>
            )}
          </div>
        </div>

        {sim.tieneSesiones && (
          <button onClick={() => setExpandido((v) => !v)}
            className="shrink-0 rounded-lg p-1.5 text-gray-600 hover:text-white hover:bg-white/10 transition">
            {expandido ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Sesiones expandidas */}
      {expandido && sim.tieneSesiones && sim.sesiones.length > 0 && (
        <div className="border-t border-white/10 px-4 py-3 space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-2">Sesiones</p>
          {sim.sesiones.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-green-600/30 text-[9px] font-bold text-green-300">
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
        {/* Editar — siempre disponible */}
        <button
          onClick={() => onEditar(sim)}
          className="flex items-center gap-1.5 rounded-xl border border-blue-500/20 px-3 py-1.5 text-xs font-semibold text-blue-400 hover:bg-blue-500/10 transition"
        >
          <Pencil className="h-3.5 w-3.5" />Editar
        </button>

        {/* Cerrar — solo si está PUBLICADO */}
        {sim.estado === "PUBLICADO" && (
          <button
            onClick={() => onCerrar(sim)}
            className="flex items-center gap-1.5 rounded-xl border border-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-400 hover:bg-amber-500/10 transition"
          >
            <Archive className="h-3.5 w-3.5" />Cerrar simulacro
          </button>
        )}

        {/* Info si ya está cerrado */}
        {sim.estado === "CERRADO" && (
          <span className="flex items-center gap-1.5 text-xs text-gray-600">
            <Info className="h-3 w-3" />Cerrado — solo editable por admin
          </span>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════
export function SimulacrosDocenteClient() {
  const [simulacros,   setSimulacros]   = useState<Simulacro[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [busqueda,     setBusqueda]     = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"TODOS" | EstadoExamen>("TODOS");
  const [toast,        setToast]        = useState<{ tipo: "ok" | "error"; msg: string } | null>(null);

  const [modalEditar, setModalEditar]   = useState<Simulacro | null>(null);
  const [modalCerrar, setModalCerrar]   = useState<Simulacro | null>(null);
  const [accionLoad,  setAccionLoad]    = useState(false);

  const showToast = (tipo: "ok" | "error", msg: string) => {
    setToast({ tipo, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const cargar = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/docente/simulacros");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSimulacros(data.simulacros ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Error al cargar simulacros.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Cerrar simulacro
  const confirmarCerrar = async () => {
    if (!modalCerrar) return;
    setAccionLoad(true);
    try {
      const res  = await fetch(`/api/docente/simulacros/${modalCerrar.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ estado: "CERRADO" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("ok", `"${modalCerrar.nombre}" cerrado correctamente.`);
      setSimulacros((prev) => prev.map((s) =>
        s.id === modalCerrar.id ? { ...s, estado: "CERRADO" as EstadoExamen } : s
      ));
    } catch (e: any) {
      showToast("error", e?.message ?? "Error al cerrar.");
    } finally {
      setAccionLoad(false);
      setModalCerrar(null);
    }
  };

  // Actualizar local tras edición
  const actualizarLocal = (id: string, datos: Partial<Simulacro>) => {
    setSimulacros((prev) => prev.map((s) => s.id === id ? { ...s, ...datos } : s));
    showToast("ok", "Simulacro actualizado correctamente.");
    setModalEditar(null);
  };

  // Filtrar
  const filtrados = simulacros.filter((s) => {
    const pasaEstado   = filtroEstado === "TODOS" || s.estado === filtroEstado;
    const pasaBusqueda = !busqueda.trim() ||
      s.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.materia.toLowerCase().includes(busqueda.toLowerCase());
    return pasaEstado && pasaBusqueda;
  });

  const countPublicados = simulacros.filter((s) => s.estado === "PUBLICADO").length;
  const countCerrados   = simulacros.filter((s) => s.estado === "CERRADO").length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-5">
      {toast && <Toast tipo={toast.tipo} msg={toast.msg} onClose={() => setToast(null)} />}

      {modalCerrar && (
        <ModalConfirm
          titulo="Cerrar simulacro"
          mensaje={`¿Confirmas cerrar "${modalCerrar.nombre}"? Esto calculará los puntajes TRI finales de todos los participantes. Esta acción no se puede deshacer sin contactar al administrador.`}
          confirmLabel="Sí, cerrar"
          onConfirm={confirmarCerrar}
          onCancel={() => setModalCerrar(null)}
          loading={accionLoad}
        />
      )}

      {modalEditar && (
        <ModalEditar
          sim={modalEditar}
          onClose={() => setModalEditar(null)}
          onGuardado={(datos) => actualizarLocal(modalEditar.id, datos)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold text-white">Gestionar Simulacros</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Puedes editar y cerrar simulacros. La creación y eliminación es exclusiva del administrador.
          </p>
        </div>
        <button onClick={cargar} disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-white/10 transition disabled:opacity-50">
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Actualizar
        </button>
      </div>

      {/* Stats rápidas */}
      {!loading && simulacros.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total",     value: simulacros.length, color: "text-white"      },
            { label: "Publicados",value: countPublicados,   color: "text-green-400"  },
            { label: "Cerrados",  value: countCerrados,     color: "text-amber-400"  },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-[var(--bg-card)] px-4 py-3 text-center">
              <p className={cn("text-2xl font-extrabold", color)}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o materia…"
          className="w-full rounded-xl border border-white/10 bg-[var(--bg-card)] pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition" />
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {(["TODOS", "PUBLICADO", "CERRADO"] as const).map((est) => (
          <button key={est} onClick={() => setFiltroEstado(est)}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition border",
              filtroEstado === est
                ? "bg-green-700 text-white border-green-700"
                : "border-white/10 text-gray-400 hover:text-white hover:border-white/20",
            )}>
            {est !== "TODOS" && (
              <span className={cn("h-1.5 w-1.5 rounded-full",
                est === "PUBLICADO" ? "bg-green-400" : "bg-amber-400")} />
            )}
            {est === "TODOS" ? "Todos" : ESTADO_CONFIG[est as EstadoExamen].label}
            <span className="opacity-60">
              ({est === "TODOS" ? simulacros.length
                : simulacros.filter((s) => s.estado === est).length})
            </span>
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-500">
          {filtrados.length} simulacro{filtrados.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-green-500" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />{error}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <ClipboardList className="h-12 w-12 text-gray-700" />
          <p className="text-sm font-semibold text-gray-500">
            {busqueda ? "Sin resultados para esa búsqueda." : "No hay simulacros disponibles."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map((sim) => (
            <SimulacroCard
              key={sim.id}
              sim={sim}
              onEditar={(s) => setModalEditar(s)}
              onCerrar={(s) => setModalCerrar(s)}
              onActualizar={actualizarLocal}
            />
          ))}
        </div>
      )}
    </div>
  );
}