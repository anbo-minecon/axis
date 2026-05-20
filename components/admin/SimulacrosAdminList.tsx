// components/admin/SimulacrosAdminList.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ClipboardList, CheckCircle2, AlertTriangle, Loader2,
  Trash2, Eye, EyeOff, Archive, RotateCcw, ChevronDown,
  ChevronUp, Layers, Clock, Hash, X, Search,
  RefreshCw, Pencil, Users, TrendingUp, TrendingDown,
  Minus, Save, Calendar, BookOpen, Mail,
  GraduationCap, CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ══════════════════════════════════════════════════════════════════════════
// TIPOS
// ══════════════════════════════════════════════════════════════════════════
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

interface Participante {
  estudianteId: string;
  nombre: string;
  email: string;
  documento: string | null;
  colegio: string | null;
  grado: number | null;
  puntaje: number;
  total: number;
  puntajeTRI: number | null;
  estadoCalif: string;
  tiempoUsado: number;
  completadoEn: string;
}

// ══════════════════════════════════════════════════════════════════════════
// CONSTANTES / HELPERS
// ══════════════════════════════════════════════════════════════════════════
const ESTADO_CONFIG: Record<EstadoExamen, { label: string; color: string; dot: string }> = {
  BORRADOR:  { label: "Borrador",  color: "bg-gray-500/20 text-gray-400 border-gray-500/30",   dot: "bg-gray-400"  },
  PUBLICADO: { label: "Publicado", color: "bg-green-500/20 text-green-400 border-green-500/30", dot: "bg-green-400" },
  CERRADO:   { label: "Cerrado",   color: "bg-amber-500/20 text-amber-400 border-amber-500/30", dot: "bg-amber-400" },
  ARCHIVADO: { label: "Archivado", color: "bg-red-500/20 text-red-400 border-red-500/30",       dot: "bg-red-400"   },
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

const MATERIAS_DISPONIBLES = [
  "Lectura Crítica", "Matemáticas", "Ciencias Naturales",
  "Sociales y Ciudadanas", "Inglés", "Multi-materia",
];

const inputCls =
  "w-full rounded-xl border border-white/10 bg-[var(--bg-secondary)] px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition";

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtTiempo(segs: number) {
  const m = Math.floor(segs / 60);
  const s = segs % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}
function getNivel(pct: number) {
  if (pct >= 80) return { label: "Alto",  color: "text-green-400", bg: "bg-green-500", icon: TrendingUp   };
  if (pct >= 50) return { label: "Medio", color: "text-amber-400", bg: "bg-amber-500", icon: Minus        };
  return           { label: "Bajo",  color: "text-red-400",   bg: "bg-red-500",   icon: TrendingDown };
}
function getAcciones(estado: EstadoExamen) {
  switch (estado) {
    case "BORRADOR":  return [
      { label: "Publicar",   nuevoEstado: "PUBLICADO" as EstadoExamen, icon: Eye,       cls: "text-green-400 hover:bg-green-500/10 border-green-500/20"  },
      { label: "Archivar",   nuevoEstado: "ARCHIVADO" as EstadoExamen, icon: Archive,   cls: "text-red-400 hover:bg-red-500/10 border-red-500/20"        },
    ];
    case "PUBLICADO": return [
      { label: "A borrador", nuevoEstado: "BORRADOR"  as EstadoExamen, icon: EyeOff,    cls: "text-gray-400 hover:bg-white/10 border-white/10"           },
      { label: "Cerrar",     nuevoEstado: "CERRADO"   as EstadoExamen, icon: Archive,   cls: "text-amber-400 hover:bg-amber-500/10 border-amber-500/20"  },
      { label: "Archivar",   nuevoEstado: "ARCHIVADO" as EstadoExamen, icon: Archive,   cls: "text-red-400 hover:bg-red-500/10 border-red-500/20"        },
    ];
    case "CERRADO":   return [
      { label: "Publicar",   nuevoEstado: "PUBLICADO" as EstadoExamen, icon: Eye,       cls: "text-green-400 hover:bg-green-500/10 border-green-500/20"  },
      { label: "Archivar",   nuevoEstado: "ARCHIVADO" as EstadoExamen, icon: Archive,   cls: "text-red-400 hover:bg-red-500/10 border-red-500/20"        },
    ];
    case "ARCHIVADO": return [
      { label: "Restaurar",  nuevoEstado: "BORRADOR"  as EstadoExamen, icon: RotateCcw, cls: "text-blue-400 hover:bg-blue-500/10 border-blue-500/20"     },
    ];
    default: return [];
  }
}

// ══════════════════════════════════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════════════════════════════════
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

// ══════════════════════════════════════════════════════════════════════════
// MODAL CONFIRMAR
// ══════════════════════════════════════════════════════════════════════════
function ModalConfirm({ titulo, mensaje, confirmLabel, confirmClass, onConfirm, onCancel, loading }: {
  titulo: string; mensaje: string; confirmLabel: string;
  confirmClass?: string; onConfirm: () => void; onCancel: () => void; loading?: boolean;
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
            className={cn("flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition disabled:opacity-50 flex items-center justify-center gap-2",
              confirmClass ?? "bg-red-600 hover:bg-red-700")}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MODAL EDITAR
// ══════════════════════════════════════════════════════════════════════════
function ModalEditar({ sim, onClose, onGuardado }: {
  sim: SimulacroAdmin;
  onClose: () => void;
  onGuardado: (datos: Partial<SimulacroAdmin>) => void;
}) {
  const [nombre,          setNombre]          = useState(sim.nombre);
  const [materia,         setMateria]         = useState(sim.materia);
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
      const res  = await fetch(`/api/admin/simulacros/${sim.id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          nombre, materia, tiempoMin,
          fechaDisponible: normFecha(fechaDisponible),
          fechaCierre:     normFecha(fechaCierre),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al guardar.");
      onGuardado({ nombre, materia, tiempoMin, fechaDisponible: fechaDisponible || null, fechaCierre: fechaCierre || null });
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

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-violet-400" />
            <h2 className="text-base font-bold text-white">Editar simulacro</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Nombre */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                Nombre <span className="text-red-400">*</span>
              </label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)}
                className={inputCls} placeholder="Nombre del simulacro" disabled={loading} />
            </div>

            {/* Materia */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Materia</label>
              <select value={materia} onChange={(e) => setMateria(e.target.value)}
                className={cn(inputCls, "cursor-pointer")} disabled={loading || sim.tieneSesiones}>
                {MATERIAS_DISPONIBLES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              {sim.tieneSesiones && (
                <p className="text-[10px] text-gray-600 mt-1">Multi-materia no es editable directamente.</p>
              )}
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
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                <Calendar className="inline h-3 w-3 mr-1" />Fecha cierre TRI
              </label>
              <input type="datetime-local" value={fechaCierre}
                onChange={(e) => setFechaCierre(e.target.value)}
                className={inputCls} disabled={loading} />
              <p className="text-[10px] text-gray-600 mt-1">Al llegar esta fecha se recalifica con TRI automáticamente.</p>
            </div>
          </div>

          {/* Sesiones solo lectura */}
          {sim.tieneSesiones && sim.sesiones.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">Sesiones</label>
              <div className="space-y-1.5">
                {sim.sesiones.map((s) => (
                  <div key={s.id}
                    className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/5 px-3 py-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-violet-600/30 text-[9px] font-bold text-violet-300">
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

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 shrink-0">
          <button onClick={onClose} disabled={loading}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-gray-300 hover:bg-white/10 transition disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={handleGuardar} disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-700 transition disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MODAL PARTICIPANTES
// ══════════════════════════════════════════════════════════════════════════
function ModalParticipantes({ sim, onClose }: { sim: SimulacroAdmin; onClose: () => void }) {
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [busqueda,      setBusqueda]      = useState("");
  const [orden,         setOrden]         = useState<"puntaje" | "nombre" | "fecha">("puntaje");

  useEffect(() => {
    fetch(`/api/admin/simulacros/${sim.id}/participantes`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setParticipantes(d.participantes ?? []);
      })
      .catch((e) => setError(e?.message ?? "Error al cargar participantes."))
      .finally(() => setLoading(false));
  }, [sim.id]);

  const filtrados = participantes
    .filter((p) => {
      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase();
      return (
        p.nombre.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.documento ?? "").includes(q) ||
        (p.colegio ?? "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (orden === "puntaje") {
        return (b.puntajeTRI ?? b.puntaje) - (a.puntajeTRI ?? a.puntaje);
      }
      if (orden === "nombre") return a.nombre.localeCompare(b.nombre);
      return new Date(b.completadoEn).getTime() - new Date(a.completadoEn).getTime();
    });

  const total    = participantes.length;
  const promedio = total > 0
    ? Math.round(participantes.reduce((acc, p) => {
        const pct = p.total > 0 ? Math.round(((p.puntajeTRI ?? p.puntaje) / p.total) * 100) : 0;
        return acc + pct;
      }, 0) / total)
    : 0;
  const oficiales = participantes.filter((p) => p.estadoCalif === "OFICIAL").length;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0d1526] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-400" />
              <h2 className="text-base font-bold text-white">Participantes</h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-md">{sim.nombre}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition shrink-0 ml-4">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stats */}
        {!loading && total > 0 && (
          <div className="grid grid-cols-3 gap-3 px-6 py-4 border-b border-white/10 shrink-0">
            {[
              { label: "Participantes", value: String(total),     color: "text-white"      },
              { label: "Promedio",      value: `${promedio}%`,    color: promedio >= 80 ? "text-green-400" : promedio >= 50 ? "text-amber-400" : "text-red-400" },
              { label: "TRI oficiales", value: String(oficiales), color: "text-violet-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-center">
                <p className={cn("text-xl font-extrabold", color)}>{value}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Controles búsqueda + orden */}
        {!loading && total > 0 && (
          <div className="flex items-center gap-2 px-6 py-3 border-b border-white/10 shrink-0 flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
              <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, email, doc…"
                className="w-full rounded-xl border border-white/10 bg-[var(--bg-card)] pl-8 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition" />
            </div>
            <select value={orden} onChange={(e) => setOrden(e.target.value as any)}
              className="rounded-xl border border-white/10 bg-[var(--bg-card)] px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-500">
              <option value="puntaje">Mayor puntaje</option>
              <option value="nombre">Nombre A–Z</option>
              <option value="fecha">Más reciente</option>
            </select>
            <span className="text-xs text-gray-500 shrink-0">
              {filtrados.length} resultado{filtrados.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 m-6 rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />{error}
            </div>
          ) : total === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <Users className="h-12 w-12 text-gray-700" />
              <p className="text-sm font-semibold text-gray-500">Ningún estudiante ha realizado este simulacro aún.</p>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-gray-500">Sin resultados para esa búsqueda.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtrados.map((p, idx) => {
                const pts        = p.puntajeTRI != null && p.estadoCalif === "OFICIAL" ? Math.round(p.puntajeTRI) : p.puntaje;
                const pct        = p.total > 0 ? Math.round((pts / p.total) * 100) : 0;
                const nivel      = getNivel(pct);
                const NivelIcon  = nivel.icon;
                const esOficial  = p.estadoCalif === "OFICIAL";

                return (
                  <div key={p.estudianteId}
                    className="flex items-start gap-4 px-6 py-4 hover:bg-white/[0.02] transition">

                    {/* Posición / ranking */}
                    <div className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold mt-0.5",
                      idx === 0 ? "bg-amber-500/20 text-amber-400"
                      : idx === 1 ? "bg-gray-400/20 text-gray-300"
                      : idx === 2 ? "bg-orange-700/20 text-orange-400"
                      : "bg-white/5 text-gray-600",
                    )}>
                      {idx + 1}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-white truncate">{p.nombre}</p>
                        {esOficial && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/20 border border-violet-500/30 px-1.5 py-0.5 text-[9px] font-bold text-violet-400">
                            <CheckCheck className="h-2.5 w-2.5" />TRI
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 flex-wrap text-[10px] text-gray-500">
                        <span className="flex items-center gap-1">
                          <Mail className="h-2.5 w-2.5" />{p.email}
                        </span>
                        {p.documento && (
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-2.5 w-2.5" />{p.documento}
                          </span>
                        )}
                        {p.colegio && (
                          <span className="flex items-center gap-1 max-w-[200px] truncate">
                            <GraduationCap className="h-2.5 w-2.5 shrink-0" />{p.colegio}
                          </span>
                        )}
                        {p.grado != null && <span>Grado {p.grado}</span>}
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-gray-600 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />{fmtTiempo(p.tiempoUsado)}
                        </span>
                        <span>{fmtFecha(p.completadoEn)}</span>
                      </div>
                    </div>

                    {/* Puntaje */}
                    <div className="shrink-0 text-right min-w-[72px]">
                      <p className={cn("text-lg font-extrabold leading-tight", nivel.color)}>
                        {pts}
                        <span className="text-xs text-gray-600 font-normal">/{p.total}</span>
                      </p>
                      <p className={cn("flex items-center justify-end gap-0.5 text-[10px] font-semibold", nivel.color)}>
                        <NivelIcon className="h-2.5 w-2.5" />{pct}%
                      </p>
                      <div className="mt-1 h-1 w-14 overflow-hidden rounded-full bg-white/10 ml-auto">
                        <div className={cn("h-full rounded-full", nivel.bg)} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// CARD
// ══════════════════════════════════════════════════════════════════════════
function SimulacroCard({
  sim, onCambiarEstado, onEliminar, onEditar, onVerParticipantes, onActualizarLocal,
}: {
  sim: SimulacroAdmin;
  onCambiarEstado:    (id: string, estado: EstadoExamen) => void;
  onEliminar:         (id: string, nombre: string) => void;
  onEditar:           (sim: SimulacroAdmin) => void;
  onVerParticipantes: (sim: SimulacroAdmin) => void;
  onActualizarLocal:  (id: string, datos: Partial<SimulacroAdmin>) => void;
}) {
  const [expandido, setExpandido] = useState(false);
  const cfg      = ESTADO_CONFIG[sim.estado];
  const acciones = getAcciones(sim.estado);

  return (
    <div className={cn(
      "rounded-2xl border bg-[var(--bg-card)] overflow-hidden transition-all",
      sim.estado === "ARCHIVADO" ? "border-white/5 opacity-60" : "border-white/10 hover:border-white/20",
    )}>
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide", cfg.color)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
              {cfg.label}
            </span>
            <span className={cn("inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold", getMateriaColor(sim.tieneSesiones ? "Multi-materia" : sim.materia))}>
              {sim.tieneSesiones ? "Multi-materia" : sim.materia}
            </span>
            {sim.triCalculado && (
              <span className="rounded-full bg-violet-500/20 border border-violet-500/30 px-2 py-0.5 text-[10px] font-semibold text-violet-400">TRI ✓</span>
            )}
          </div>
          <h3 className="text-sm font-bold text-white truncate">{sim.nombre}</h3>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 flex-wrap">
            <span className="flex items-center gap-1"><Hash className="h-3 w-3" />{sim._count.claves} preguntas</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{sim.tiempoMin} min</span>
            {sim.tieneSesiones && (
              <span className="flex items-center gap-1"><Layers className="h-3 w-3" />{sim.sesiones.length} sesiones</span>
            )}
            <span>Creado {fmtFecha(sim.createdAt)}</span>
            {sim.fechaCierre && <span className="text-amber-500">Cierre: {fmtFecha(sim.fechaCierre)}</span>}
          </div>
        </div>
        {sim.tieneSesiones && (
          <button onClick={() => setExpandido((v) => !v)}
            className="shrink-0 rounded-lg p-1.5 text-gray-600 hover:text-white hover:bg-white/10 transition">
            {expandido ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Sesiones */}
      {expandido && sim.tieneSesiones && sim.sesiones.length > 0 && (
        <div className="border-t border-white/10 px-4 py-3 space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-2">Sesiones</p>
          {sim.sesiones.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-violet-600/30 text-[9px] font-bold text-violet-300">{s.numero}</div>
              <span className="flex-1 text-xs text-gray-400 truncate">{s.nombre}</span>
              <span className="text-[10px] text-gray-600">{s.tiempoMin} min</span>
            </div>
          ))}
        </div>
      )}

      {/* Acciones */}
      <div className="border-t border-white/10 px-4 py-3 flex items-center gap-2 flex-wrap">
        {/* Cambios de estado */}
        {acciones.map(({ label, nuevoEstado, icon: Icon, cls }) => (
          <button key={nuevoEstado} onClick={() => onCambiarEstado(sim.id, nuevoEstado)}
            className={cn("flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition border", cls)}>
            <Icon className="h-3.5 w-3.5" />{label}
          </button>
        ))}

        {/* Editar */}
        <button onClick={() => onEditar(sim)}
          className="flex items-center gap-1.5 rounded-xl border border-blue-500/20 px-3 py-1.5 text-xs font-semibold text-blue-400 hover:bg-blue-500/10 transition">
          <Pencil className="h-3.5 w-3.5" />Editar
        </button>

        {/* Ver participantes */}
        <button onClick={() => onVerParticipantes(sim)}
          className="flex items-center gap-1.5 rounded-xl border border-violet-500/20 px-3 py-1.5 text-xs font-semibold text-violet-400 hover:bg-violet-500/10 transition">
          <Users className="h-3.5 w-3.5" />Participantes
        </button>

        {/* Eliminar solo borradores */}
        {sim.estado === "BORRADOR" && (
          <button onClick={() => onEliminar(sim.id, sim.nombre)}
            className="ml-auto flex items-center gap-1.5 rounded-xl border border-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-500/10 transition">
            <Trash2 className="h-3.5 w-3.5" />Eliminar
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
  const [simulacros,   setSimulacros]   = useState<SimulacroAdmin[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [filtroEstado, setFiltroEstado] = useState<EstadoExamen | "TODOS">("TODOS");
  const [busqueda,     setBusqueda]     = useState("");
  const [toast,        setToast]        = useState<{ tipo: "ok" | "error"; msg: string } | null>(null);

  const [modalEstado,        setModalEstado]        = useState<{ id: string; nombre: string; nuevoEstado: EstadoExamen } | null>(null);
  const [modalEliminar,      setModalEliminar]      = useState<{ id: string; nombre: string } | null>(null);
  const [modalEditar,        setModalEditar]        = useState<SimulacroAdmin | null>(null);
  const [modalParticipantes, setModalParticipantes] = useState<SimulacroAdmin | null>(null);
  const [accionLoading,      setAccionLoading]      = useState(false);

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

  const confirmarCambioEstado = async () => {
    if (!modalEstado) return;
    setAccionLoading(true);
    try {
      const res  = await fetch(`/api/admin/simulacros/${modalEstado.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body:   JSON.stringify({ estado: modalEstado.nuevoEstado }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("ok", `"${modalEstado.nombre}" → ${ESTADO_CONFIG[modalEstado.nuevoEstado].label}`);
      setSimulacros((prev) => prev.map((s) => s.id === modalEstado.id ? { ...s, estado: modalEstado.nuevoEstado } : s));
    } catch (e: any) {
      showToast("error", e?.message ?? "Error al cambiar estado.");
    } finally {
      setAccionLoading(false); setModalEstado(null);
    }
  };

  const confirmarEliminar = async () => {
    if (!modalEliminar) return;
    setAccionLoading(true);
    try {
      const res  = await fetch(`/api/admin/simulacros/${modalEliminar.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("ok", `"${modalEliminar.nombre}" eliminado.`);
      setSimulacros((prev) => prev.filter((s) => s.id !== modalEliminar.id));
    } catch (e: any) {
      showToast("error", e?.message ?? "Error al eliminar.");
    } finally {
      setAccionLoading(false); setModalEliminar(null);
    }
  };

  const actualizarLocal = (id: string, datos: Partial<SimulacroAdmin>) => {
    setSimulacros((prev) => prev.map((s) => s.id === id ? { ...s, ...datos } : s));
    showToast("ok", "Simulacro actualizado correctamente.");
  };

  const filtrados = simulacros.filter((s) => {
    const pasaEstado   = filtroEstado === "TODOS" || s.estado === filtroEstado;
    const pasaBusqueda = !busqueda.trim() ||
      s.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.materia.toLowerCase().includes(busqueda.toLowerCase());
    return pasaEstado && pasaBusqueda;
  });

  const contadores: Record<string, number> = {
    TODOS:     simulacros.length,
    BORRADOR:  simulacros.filter((s) => s.estado === "BORRADOR").length,
    PUBLICADO: simulacros.filter((s) => s.estado === "PUBLICADO").length,
    CERRADO:   simulacros.filter((s) => s.estado === "CERRADO").length,
    ARCHIVADO: simulacros.filter((s) => s.estado === "ARCHIVADO").length,
  };

  return (
    <div className="space-y-5">
      {toast && <Toast tipo={toast.tipo} msg={toast.msg} onClose={() => setToast(null)} />}

      {modalEstado && (
        <ModalConfirm
          titulo={`Cambiar a ${ESTADO_CONFIG[modalEstado.nuevoEstado].label}`}
          mensaje={`¿Confirmas cambiar "${modalEstado.nombre}" a ${ESTADO_CONFIG[modalEstado.nuevoEstado].label}?${
            modalEstado.nuevoEstado === "CERRADO" ? " Esto calculará los puntajes TRI finales." : ""
          }`}
          confirmLabel="Confirmar" confirmClass="bg-blue-600 hover:bg-blue-700"
          onConfirm={confirmarCambioEstado} onCancel={() => setModalEstado(null)} loading={accionLoading}
        />
      )}

      {modalEliminar && (
        <ModalConfirm
          titulo="Eliminar simulacro"
          mensaje={`¿Eliminar permanentemente "${modalEliminar.nombre}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar" confirmClass="bg-red-600 hover:bg-red-700"
          onConfirm={confirmarEliminar} onCancel={() => setModalEliminar(null)} loading={accionLoading}
        />
      )}

      {modalEditar && (
        <ModalEditar sim={modalEditar} onClose={() => setModalEditar(null)}
          onGuardado={(datos) => { actualizarLocal(modalEditar.id, datos); setModalEditar(null); }} />
      )}

      {modalParticipantes && (
        <ModalParticipantes sim={modalParticipantes} onClose={() => setModalParticipantes(null)} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-gray-500">{simulacros.length} simulacro{simulacros.length !== 1 ? "s" : ""} en total</p>
        <button onClick={cargar} disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-white/10 transition disabled:opacity-50">
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />Actualizar
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o materia…"
          className="w-full rounded-xl border border-white/10 bg-[var(--bg-card)] pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition" />
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {(["TODOS", "BORRADOR", "PUBLICADO", "CERRADO", "ARCHIVADO"] as const).map((est) => (
          <button key={est} onClick={() => setFiltroEstado(est)}
            className={cn("flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition border",
              filtroEstado === est ? "bg-violet-600 text-white border-violet-600" : "border-white/10 text-gray-400 hover:text-white hover:border-white/20")}>
            {est !== "TODOS" && <span className={cn("h-1.5 w-1.5 rounded-full", ESTADO_CONFIG[est as EstadoExamen].dot)} />}
            {est === "TODOS" ? "Todos" : ESTADO_CONFIG[est as EstadoExamen].label}
            <span className="opacity-60">({contadores[est]})</span>
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-violet-500" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />{error}
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
            <SimulacroCard key={sim.id} sim={sim}
              onCambiarEstado={(id, estado) => {
                const s = simulacros.find((x) => x.id === id);
                if (s) setModalEstado({ id, nombre: s.nombre, nuevoEstado: estado });
              }}
              onEliminar={(id, nombre) => setModalEliminar({ id, nombre })}
              onEditar={(s) => setModalEditar(s)}
              onVerParticipantes={(s) => setModalParticipantes(s)}
              onActualizarLocal={actualizarLocal}
            />
          ))}
        </div>
      )}
    </div>
  );
}